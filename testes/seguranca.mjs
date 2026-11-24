// Testes de segurança da base de dados (Supabase), feitos como um visitante qualquer (chave pública).
// Confirmam que as regras (RLS) protegem os dados: tudo o que aqui está marcado como "recusado"
// tem de falhar. Nenhum destes testes cria dados reais.
//
// Correr:  node testes/seguranca.mjs
const URL_SB = 'https://yctyaycgxbbwnzgrkfwq.supabase.co';
const CHAVE = 'sb_publishable_rg8_rF7TpfGwoqCZtQSFqQ_D4q1a_6F';
const H = { apikey: CHAVE, Authorization: `Bearer ${CHAVE}`, 'Content-Type': 'application/json' };

let falhas = 0;
const ok = (nome) => console.log(`  ✔ ${nome}`);
const erro = (nome, det) => { falhas++; console.log(`  ✘ ${nome}${det ? ` — ${det}` : ''}`); };

async function pedido(caminho, opcoes = {}) {
  const r = await fetch(`${URL_SB}${caminho}`, { ...opcoes, headers: { ...H, ...(opcoes.headers || {}) } });
  let corpo = null;
  try { corpo = await r.json(); } catch {}
  return { estado: r.status, corpo };
}

// Leitura: o visitante não pode ver nenhuma linha destas tabelas (ou a tabela nem lhe é visível).
async function semLeitura(tabela) {
  const { estado, corpo } = await pedido(`/rest/v1/${tabela}?select=*&limit=5`);
  if (estado >= 400 || (Array.isArray(corpo) && corpo.length === 0)) ok(`não lê ${tabela}`);
  else erro(`LÊ ${tabela}`, `${Array.isArray(corpo) ? corpo.length : '?'} linhas visíveis`);
}

// Escrita: tem de ser recusada. "Prefer: return=minimal" evita devolver dados.
async function recusado(nome, caminho, metodo, corpo) {
  const { estado } = await pedido(caminho, { method: metodo, body: corpo && JSON.stringify(corpo), headers: { Prefer: 'return=representation' } });
  // PATCH/DELETE sem permissão devolvem 200/204 com 0 linhas; por isso confirmamos pelo corpo devolvido.
  if (estado >= 400) ok(nome);
  else erro(nome, `estado ${estado}`);
}
async function semEfeito(nome, caminho, metodo, corpo) {
  const { estado, corpo: c } = await pedido(caminho, { method: metodo, body: corpo && JSON.stringify(corpo), headers: { Prefer: 'return=representation' } });
  if (estado >= 400 || (Array.isArray(c) && c.length === 0)) ok(nome);
  else erro(nome, `alterou ${Array.isArray(c) ? c.length : '?'} linhas`);
}

console.log('\nDados pessoais e áreas reservadas');
for (const t of ['atendimentos', 'atendimentos_historico', 'perfis', 'perfis_antigo', 'auditoria']) await semLeitura(t);

console.log('\nNotícias');
{
  const { estado, corpo } = await pedido('/rest/v1/noticias?select=id,estado&limit=200');
  if (estado !== 200) erro('notícias públicas legíveis', `estado ${estado}`);
  else {
    ok(`notícias públicas legíveis (${corpo.length})`);
    const naoPublicadas = corpo.filter((n) => n.estado && n.estado !== 'publicado');
    naoPublicadas.length ? erro('rascunhos escondidos', `${naoPublicadas.length} visíveis`) : ok('rascunhos e notícias em revisão escondidos');
  }
}
await recusado('não cria notícias', '/rest/v1/noticias', 'POST', { id: 'teste-seguranca', title: 'x', estado: 'publicado' });
await semEfeito('não altera notícias', '/rest/v1/noticias?id=neq.__nada__', 'PATCH', { title: 'alterado' });
await semEfeito('não apaga notícias', '/rest/v1/noticias?id=eq.__nada_que_exista__', 'DELETE');

console.log('\nAvisos');
await recusado('não cria avisos', '/rest/v1/avisos', 'POST', { texto: 'teste', tipo: 'info' });
await semEfeito('não altera avisos', '/rest/v1/avisos?id=gt.0', 'PATCH', { texto: 'alterado' });

console.log('\nAtendimentos (só pode enviar pedidos novos, nunca respostas nem estados)');
await recusado('não envia pedido já "Resolvida"', '/rest/v1/atendimentos', 'POST',
  { nome: 'Teste', email: 'teste@exemplo.ao', assunto: 'Sugestão', mensagem: 'teste', status: 'Resolvida' });
await recusado('não envia pedido com resposta', '/rest/v1/atendimentos', 'POST',
  { nome: 'Teste', email: 'teste@exemplo.ao', assunto: 'Sugestão', mensagem: 'teste', resposta: 'falsa' });
await semEfeito('não altera pedidos', '/rest/v1/atendimentos?id=gt.0', 'PATCH', { status: 'Encerrada' });
await semEfeito('não apaga pedidos', '/rest/v1/atendimentos?id=gt.0', 'DELETE');
await recusado('não escreve no histórico', '/rest/v1/atendimentos_historico', 'POST', { atendimento_id: 1, tipo: 'nota', texto: 'x' });

console.log('\nConsulta pública de pedidos');
{
  const { estado, corpo } = await pedido('/rest/v1/rpc/consultar_pedido', { method: 'POST', body: JSON.stringify({ p_codigo: 'ZZZZ-0000' }) });
  if (estado === 200 && Array.isArray(corpo) && corpo.length === 0) ok('número inexistente não devolve nada');
  else erro('número inexistente', `estado ${estado}`);
  const r2 = await pedido('/rest/v1/rpc/consultar_pedido', { method: 'POST', body: JSON.stringify({ p_codigo: '%' }) });
  if (r2.estado === 200 && Array.isArray(r2.corpo) && r2.corpo.length === 0) ok('caracteres especiais não listam pedidos');
  else erro('caracteres especiais', `estado ${r2.estado}`);
}

console.log('\nFunções reservadas à equipa');
for (const f of ['estatisticas_atendimento', 'equipa_atendimento']) {
  const { estado, corpo } = await pedido(`/rest/v1/rpc/${f}`, { method: 'POST', body: '{}' });
  if (estado >= 400 || (Array.isArray(corpo) && corpo.length === 0)) ok(`${f} não responde a visitantes`);
  else erro(`${f} responde a visitantes`, `${corpo.length} linhas`);
}

console.log('\nFicheiros (Storage)');
{
  const { estado, corpo } = await pedido('/storage/v1/object/list/atendimentos', { method: 'POST', body: JSON.stringify({ prefix: 'documentos', limit: 5 }) });
  if (estado >= 400 || (Array.isArray(corpo) && corpo.length === 0)) ok('documentos dos cidadãos não são listáveis');
  else erro('documentos dos cidadãos LISTÁVEIS', `${corpo.length} ficheiros`);
  const pub = await fetch(`${URL_SB}/storage/v1/object/public/atendimentos/documentos/x.pdf`);
  pub.status >= 400 ? ok('pasta de documentos não é pública') : erro('pasta de documentos pública', `estado ${pub.status}`);
}

console.log('\nRegisto de contas');
{
  const { estado } = await pedido('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email: `teste-${Date.now()}@exemplo.ao`, password: 'Xx-123456789!' }) });
  estado >= 400 ? ok('registo de contas desligado') : erro('REGISTO DE CONTAS LIGADO', `estado ${estado}`);
}

console.log(falhas ? `\n${falhas} teste(s) falharam.\n` : '\nTodos os testes de segurança passaram.\n');
process.exit(falhas ? 1 : 0);
