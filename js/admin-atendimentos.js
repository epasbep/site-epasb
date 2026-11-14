// Painel administrativo: entrada (login) e gestão dos atendimentos ao cidadão.
import { sb, obterSessao, ligarTopo } from './admin-sessao.js';
import { esc } from './util.js';

const $ = (id) => document.getElementById(id);
const login = $('login'), painel = $('painel'), modal = $('modal');
const CLASSES = { 'Em análise': 'estado--analise', Respondido: 'estado--respondido', Encerrado: 'estado--encerrado' };
let lista = [], actual = null;

const dataHora = (iso) => (iso ? new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : '-');

// ---------- Entrada ----------
$('form-login').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const botao = $('entrar'), erro = $('login-erro');
  erro.textContent = '';
  botao.disabled = true; botao.textContent = 'A entrar…';
  const { data, error } = await sb.auth.signInWithPassword({ email: $('login-email').value.trim(), password: $('login-senha').value });
  botao.disabled = false; botao.textContent = 'Entrar';
  if (error) { erro.textContent = 'Não foi possível iniciar sessão. Verifique o email e a palavra-passe.'; return; }
  mostrarPainel(data.session);
});

async function mostrarPainel(sessao) {
  login.hidden = true;
  painel.hidden = false;
  ligarTopo(sessao);
  await carregar();
}

// ---------- Lista ----------
async function carregar() {
  const estado = $('estado-lista'), corpo = $('linhas');
  estado.hidden = false; estado.textContent = 'A carregar atendimentos…';
  $('tabela').hidden = true;
  const { data, error } = await sb.from('atendimentos').select('*').order('created_at', { ascending: false });
  if (error) { estado.textContent = 'Erro ao carregar atendimentos: ' + error.message; return; }
  lista = data || [];

  const conta = (s) => lista.filter((a) => a.status === s).length;
  $('c-total').textContent = lista.length;
  $('c-novos').textContent = conta('Novo');
  $('c-analise').textContent = conta('Em análise');
  $('c-respondidos').textContent = conta('Respondido');
  $('c-encerrados').textContent = conta('Encerrado');

  if (!lista.length) { estado.textContent = 'Não existem atendimentos registados.'; return; }
  estado.hidden = true;
  $('tabela').hidden = false;
  corpo.innerHTML = lista.map((a) => `<tr>
    <td>#${esc(a.id)}</td><td>${esc(dataHora(a.created_at))}</td><td>${esc(a.nome)}</td><td>${esc(a.email)}</td><td>${esc(a.assunto)}</td>
    <td><span class="estado ${CLASSES[a.status] || ''}">${esc(a.status || 'Novo')}</span></td>
    <td><button class="btn btn--primario" type="button" data-ver="${esc(a.id)}">Ver</button></td></tr>`).join('');
}

$('linhas').addEventListener('click', (e) => {
  const id = e.target.closest('[data-ver]')?.dataset.ver;
  if (id) abrir(lista.find((a) => String(a.id) === id));
});
$('actualizar').addEventListener('click', carregar);

// ---------- Detalhe ----------
async function abrir(a) {
  actual = a;
  let doc = 'Nenhum documento anexado.';
  if (a.documento_url) {
    const { data, error } = await sb.storage.from('atendimentos').createSignedUrl(a.documento_url, 300);
    doc = error || !data?.signedUrl
      ? 'Não foi possível abrir o documento.'
      : `<a href="${esc(data.signedUrl)}" target="_blank" rel="noopener noreferrer">Abrir documento</a>`;
  }
  $('detalhes').innerHTML = `
    <div><dt>ID</dt><dd>#${esc(a.id)}</dd></div>
    <div><dt>Data</dt><dd>${esc(dataHora(a.created_at))}</dd></div>
    <div><dt>Nome</dt><dd>${esc(a.nome)}</dd></div>
    <div><dt>Email</dt><dd>${esc(a.email)}</dd></div>
    <div><dt>Telefone</dt><dd>${esc(a.telefone || '-')}</dd></div>
    <div><dt>Assunto</dt><dd>${esc(a.assunto)}</dd></div>
    <div class="largo"><dt>Mensagem</dt><dd>${esc(a.mensagem)}</dd></div>
    <div class="largo"><dt>Documento anexado</dt><dd>${doc}</dd></div>`;
  $('estado').value = a.status || 'Novo';
  $('resposta').value = a.resposta || '';
  $('modal-erro').textContent = '';
  modal.hidden = false;
  $('fechar').focus();
}

const fechar = () => { modal.hidden = true; actual = null; };
$('fechar').addEventListener('click', fechar);
modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) fechar(); });

$('guardar').addEventListener('click', async () => {
  if (!actual) return;
  const botao = $('guardar');
  botao.disabled = true; botao.textContent = 'A guardar…';
  const { error } = await sb.from('atendimentos')
    .update({ status: $('estado').value, resposta: $('resposta').value.trim(), atualizado_at: new Date().toISOString() })
    .eq('id', actual.id);
  botao.disabled = false; botao.textContent = 'Guardar alterações';
  if (error) { $('modal-erro').textContent = 'Não foi possível guardar: ' + error.message; return; }
  fechar();
  await carregar();
});

$('eliminar').addEventListener('click', async () => {
  if (!actual) return;
  if (!confirm(`Eliminar o atendimento #${actual.id}?\n\nEsta acção não pode ser desfeita.`)) return;
  const a = actual;
  const { error } = await sb.from('atendimentos').delete().eq('id', a.id);
  if (error) { $('modal-erro').textContent = 'Não foi possível eliminar: ' + error.message; return; }
  if (a.documento_url) await sb.storage.from('atendimentos').remove([a.documento_url]);
  fechar();
  await carregar();
});

// ---------- Arranque ----------
const sessao = await obterSessao();
if (sessao) mostrarPainel(sessao);
else login.hidden = false;
