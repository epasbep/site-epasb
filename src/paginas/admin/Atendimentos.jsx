// Painel administrativo: entrada (login) e gestão dos atendimentos ao cidadão.
import { useEffect, useRef, useState } from 'react';
import { sb } from '../../supabase.js';
import { pub } from '../../util.js';
import { useAcesso, Painel, pode, primeiraPagina, marcarActividade } from '../../componentes/Admin.jsx';

export const ESTADOS = ['Recebida', 'Em análise', 'Em tratamento', 'Resolvida', 'Encerrada'];
export const PRIORIDADES = ['Baixa', 'Normal', 'Alta', 'Urgente'];
const CATEGORIAS = ['Falta de água', 'Fuga ou rotura', 'Qualidade da água', 'Facturação', 'Contador', 'Ligação nova', 'Saneamento', 'Atendimento', 'Outro'];
export const CLASSES = { 'Em análise': 'estado--analise', 'Em tratamento': 'estado--tratamento', Resolvida: 'estado--respondido', Encerrada: 'estado--encerrado' };
const CLASSES_PRIORIDADE = { Alta: 'prioridade--alta', Urgente: 'prioridade--urgente', Baixa: 'prioridade--baixa' };
const ABERTOS = ['Recebida', 'Em análise', 'Em tratamento'];
const dataHora = (iso) => (iso ? new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : '-');
const nomeDe = (m) => (m ? m.nome || m.email : '');

function Historico({ id, recarregar }) {
  const [linhas, setLinhas] = useState(null);
  useEffect(() => {
    sb.from('atendimentos_historico').select('*').eq('atendimento_id', id).order('quando')
      .then(({ data }) => setLinhas(data || []));
  }, [id, recarregar]);
  const texto = (h) => ({
    criado: 'Pedido recebido',
    estado: <>Estado: {h.de || '-'} → <strong>{h.para}</strong></>,
    resposta: 'Resposta enviada ao cidadão',
    nota: 'Nota interna',
    prioridade: <>Prioridade: {h.de || '-'} → <strong>{h.para}</strong></>,
    categoria: <>Categoria: {h.de || '-'} → <strong>{h.para || '-'}</strong></>,
    responsavel: <>Responsável: {h.de || 'ninguém'} → <strong>{h.para || 'ninguém'}</strong></>
  }[h.tipo] || h.tipo);
  if (linhas === null) return <p className="vazio">A carregar histórico…</p>;
  return (
    <ol className="historico">
      {linhas.map((h) => (
        <li key={h.id} className={`historico__item historico__item--${h.tipo}`}>
          <div className="historico__topo">
            <span>{texto(h)}</span>
            <small>{dataHora(h.quando)}{h.autor ? ` · ${h.autor}` : ''}{h.publico ? '' : ' · interno'}</small>
          </div>
          {h.texto && <p>{h.texto}</p>}
        </li>
      ))}
    </ol>
  );
}

function Detalhe({ atendimento: a, equipa, fechar, aoMudar, podeApagar, eu }) {
  const [form, setForm] = useState({
    status: a.status || 'Recebida', prioridade: a.prioridade || 'Normal', categoria: a.categoria || '',
    responsavel: a.responsavel || '', resposta: ''
  });
  const [nota, setNota] = useState('');
  const [doc, setDoc] = useState(a.documento_url ? undefined : null); // undefined = a gerar link
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [versao, setVersao] = useState(0);
  const botaoFechar = useRef(null);
  const mudar = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  useEffect(() => {
    botaoFechar.current?.focus();
    const tecla = (e) => { if (e.key === 'Escape') fechar(); };
    document.addEventListener('keydown', tecla);
    // O anexo abre com um link temporário (5 minutos).
    if (a.documento_url) {
      sb.storage.from('atendimentos').createSignedUrl(a.documento_url, 300)
        .then(({ data, error }) => setDoc(error || !data?.signedUrl ? false : data.signedUrl));
    }
    return () => document.removeEventListener('keydown', tecla);
  }, []);

  async function guardar() {
    setOcupado(true);
    setErro('');
    const alteracoes = {
      status: form.status, prioridade: form.prioridade, categoria: form.categoria || null,
      responsavel: form.responsavel || null, atualizado_at: new Date().toISOString()
    };
    // Uma resposta nova substitui a anterior no pedido; todas ficam no histórico.
    // Se o estado não foi mudado à mão, responder passa o pedido a "Resolvida".
    if (form.resposta.trim()) {
      alteracoes.resposta = form.resposta.trim();
      if (ABERTOS.includes(form.status) && form.status === (a.status || 'Recebida')) alteracoes.status = 'Resolvida';
    }
    const { error } = await sb.from('atendimentos').update(alteracoes).eq('id', a.id);
    setOcupado(false);
    if (error) { setErro('Não foi possível guardar: ' + error.message); return; }
    aoMudar();
  }

  async function anotar() {
    if (!nota.trim()) return;
    setOcupado(true);
    const { error } = await sb.from('atendimentos_historico')
      .insert({ atendimento_id: a.id, tipo: 'nota', texto: nota.trim(), publico: false, user_id: eu });
    setOcupado(false);
    if (error) { setErro('Não foi possível guardar a nota: ' + error.message); return; }
    setNota('');
    setVersao((v) => v + 1);
  }

  async function eliminar() {
    if (!confirm(`Eliminar o pedido ${a.codigo || '#' + a.id}?\n\nEsta acção não pode ser desfeita.`)) return;
    setOcupado(true);
    const { error } = await sb.from('atendimentos').delete().eq('id', a.id);
    if (error) { setOcupado(false); setErro('Não foi possível eliminar: ' + error.message); return; }
    if (a.documento_url) await sb.storage.from('atendimentos').remove([a.documento_url]);
    aoMudar();
  }

  return (
    <div className="modal" onClick={(e) => { if (e.target === e.currentTarget) fechar(); }}>
      <div className="modal__caixa modal__caixa--largo" role="dialog" aria-modal="true" aria-labelledby="m-t">
        <div className="modal__topo">
          <h2 id="m-t">Pedido {a.codigo || `#${a.id}`}</h2>
          <button className="modal__fechar" type="button" aria-label="Fechar" ref={botaoFechar} onClick={fechar}>×</button>
        </div>
        <dl className="detalhes">
          <div><dt>Submetido em</dt><dd>{dataHora(a.created_at)}</dd></div>
          <div><dt>Assunto</dt><dd>{a.assunto}</dd></div>
          <div><dt>Nome</dt><dd>{a.nome}</dd></div>
          <div><dt>Email</dt><dd><a href={`mailto:${a.email}`}>{a.email}</a></dd></div>
          <div><dt>Telefone</dt><dd>{a.telefone ? <a href={`tel:${a.telefone}`}>{a.telefone}</a> : '-'}</dd></div>
          <div><dt>Documento anexado</dt><dd>
            {doc === null && 'Nenhum.'}
            {doc === undefined && 'A preparar…'}
            {doc === false && 'Não foi possível abrir.'}
            {doc && <a href={doc} target="_blank" rel="noopener noreferrer">Abrir documento</a>}
          </dd></div>
          <div className="largo"><dt>Mensagem</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{a.mensagem}</dd></div>
          {a.resposta && <div className="largo"><dt>Última resposta enviada</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{a.resposta}</dd></div>}
        </dl>

        <div className="grelha-campos">
          <div className="campo">
            <label htmlFor="d-estado">Estado</label>
            <select className="select" id="d-estado" name="status" value={form.status} onChange={mudar}>
              {ESTADOS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="d-prio">Prioridade</label>
            <select className="select" id="d-prio" name="prioridade" value={form.prioridade} onChange={mudar}>
              {PRIORIDADES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="d-cat">Categoria</label>
            <select className="select" id="d-cat" name="categoria" value={form.categoria} onChange={mudar}>
              <option value="">Sem categoria</option>
              {CATEGORIAS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="d-resp">Responsável</label>
            <select className="select" id="d-resp" name="responsavel" value={form.responsavel} onChange={mudar}>
              <option value="">Ninguém</option>
              {equipa.map((m) => <option key={m.user_id} value={m.user_id}>{nomeDe(m)}{m.user_id === eu ? ' (eu)' : ''}</option>)}
            </select>
          </div>
        </div>
        <div className="campo">
          <label htmlFor="d-resposta">{a.resposta ? 'Nova resposta ao cidadão' : 'Resposta ao cidadão'}</label>
          <p className="campo__ajuda">O cidadão vê esta resposta ao consultar o pedido com o número. Ao responder, o estado passa a «Resolvida», se não o mudar.</p>
          <textarea className="textarea" id="d-resposta" name="resposta" rows="4" value={form.resposta} onChange={mudar} />
          <p className="campo__erro" role="alert">{erro}</p>
        </div>
        <div className="botoes">
          <button className="btn btn--primario" type="button" disabled={ocupado} onClick={guardar}>Guardar alterações</button>
          {podeApagar && <button className="btn btn--perigo" type="button" disabled={ocupado} onClick={eliminar}>Eliminar pedido</button>}
        </div>

        <section className="detalhe__historico" aria-labelledby="h-hist">
          <h3 id="h-hist" className="h3">Histórico</h3>
          <Historico id={a.id} recarregar={versao} />
          <div className="campo" style={{ marginTop: 12 }}>
            <label htmlFor="d-nota">Nota interna</label>
            <p className="campo__ajuda">Só a equipa vê as notas internas.</p>
            <textarea className="textarea" id="d-nota" rows="2" value={nota} onChange={(e) => setNota(e.target.value)} />
          </div>
          <div className="botoes">
            <button className="btn btn--secundario" type="button" disabled={ocupado || !nota.trim()} onClick={anotar}>Acrescentar nota</button>
          </div>
        </section>
      </div>
    </div>
  );
}

const FILTROS = [['abertos', 'Em aberto'], ['meus', 'Atribuídos a mim'], ['sem', 'Sem responsável'], ['urgentes', 'Alta e urgente'], ['todos', 'Todos']];

function Lista({ perfil, sessao }) {
  const [lista, setLista] = useState(null); // null = a carregar
  const [equipa, setEquipa] = useState([]);
  const [erro, setErro] = useState('');
  const [aberto, setAberto] = useState(null);
  const [filtro, setFiltro] = useState('abertos');
  const [estado, setEstado] = useState('');
  const [procura, setProcura] = useState('');
  const eu = sessao.user.id;

  async function carregar() {
    setErro('');
    const { data, error } = await sb.from('atendimentos').select('*').order('created_at', { ascending: false });
    if (error) setErro('Erro ao carregar atendimentos: ' + error.message);
    setLista(data || []);
  }
  useEffect(() => {
    carregar();
    sb.rpc('equipa_atendimento').then(({ data }) => setEquipa(data || []));
  }, []);

  const membro = (id) => equipa.find((m) => m.user_id === id);
  const conta = (s) => (lista || []).filter((a) => a.status === s).length;
  const contadores = [['Total', lista?.length ?? 0], ...ESTADOS.map((s) => [s, conta(s)])];

  const termo = procura.trim().toLowerCase();
  const visiveis = (lista || []).filter((a) => {
    if (filtro === 'abertos' && !ABERTOS.includes(a.status)) return false;
    if (filtro === 'meus' && a.responsavel !== eu) return false;
    if (filtro === 'sem' && (a.responsavel || !ABERTOS.includes(a.status))) return false;
    if (filtro === 'urgentes' && !(['Alta', 'Urgente'].includes(a.prioridade) && ABERTOS.includes(a.status))) return false;
    if (estado && a.status !== estado) return false;
    if (termo && ![a.codigo, a.nome, a.email, a.telefone, a.assunto, a.categoria, String(a.id)]
      .some((v) => String(v || '').toLowerCase().includes(termo))) return false;
    return true;
  });

  return (
    <>
      <main className="container admin">
        <p className="admin__migalhas">Painel / Atendimentos</p>
        <h1 className="admin__titulo">Reclamações e atendimentos</h1>
        <section className="contadores" aria-label="Resumo">
          {contadores.map(([nome, n]) => <div className="contador" key={nome}><span>{nome}</span><strong>{n}</strong></div>)}
        </section>
        <div className="filtros" role="group" aria-label="Filtrar pedidos">
          {FILTROS.map(([id, nome]) => <button key={id} type="button" aria-pressed={filtro === id} onClick={() => setFiltro(id)}>{nome}</button>)}
        </div>
        <section className="painel">
          <div className="painel__topo painel__topo--filtros">
            <input className="input" type="search" placeholder="Procurar por número, nome, email ou telefone"
              aria-label="Procurar pedidos" value={procura} onChange={(e) => setProcura(e.target.value)} />
            <select className="select" aria-label="Filtrar por estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="">Todos os estados</option>
              {ESTADOS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button className="btn btn--secundario" type="button" onClick={carregar}>Actualizar</button>
          </div>
          {lista === null && <p className="vazio" style={{ border: 0 }}>A carregar atendimentos…</p>}
          {erro && <p className="vazio" style={{ border: 0 }}>{erro}</p>}
          {lista && !erro && visiveis.length === 0 && <p className="vazio" style={{ border: 0 }}>Nenhum pedido corresponde a este filtro.</p>}
          {visiveis.length > 0 && (
            <div className="tabela-rolo">
              <table className="tabela">
                <thead><tr><th>Número</th><th>Submetido</th><th>Nome</th><th>Assunto</th><th>Prioridade</th><th>Responsável</th><th>Estado</th><th>Acção</th></tr></thead>
                <tbody>
                  {visiveis.map((a) => (
                    <tr key={a.id}>
                      <td><strong>{a.codigo || `#${a.id}`}</strong></td>
                      <td>{dataHora(a.created_at)}</td>
                      <td>{a.nome}</td>
                      <td>{a.assunto}{a.categoria && <><br /><small style={{ color: 'var(--texto-3)' }}>{a.categoria}</small></>}</td>
                      <td><span className={`prioridade ${CLASSES_PRIORIDADE[a.prioridade] || ''}`}>{a.prioridade || 'Normal'}</span></td>
                      <td>{a.responsavel ? (a.responsavel === eu ? 'Eu' : nomeDe(membro(a.responsavel)) || '—') : '—'}</td>
                      <td><span className={`estado ${CLASSES[a.status] || ''}`}>{a.status || 'Recebida'}</span></td>
                      <td><button className="btn btn--primario" type="button" onClick={() => setAberto(a)}>Abrir</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      {aberto && <Detalhe key={aberto.id} atendimento={aberto} equipa={equipa} eu={eu} podeApagar={perfil.papel === 'super_admin'}
        fechar={() => setAberto(null)} aoMudar={() => { setAberto(null); carregar(); }} />}
    </>
  );
}

// Relatório para o Gestor: só números, sem nomes, emails, telefones nem mensagens.
function Relatorio() {
  const [linhas, setLinhas] = useState(null);
  const [erro, setErro] = useState('');
  useEffect(() => {
    sb.rpc('estatisticas_atendimento').then(({ data, error }) => {
      if (error) setErro('Não foi possível carregar o relatório: ' + error.message);
      setLinhas(data || []);
    });
  }, []);

  const somar = (chave) => Object.entries((linhas || []).reduce((acc, l) => ({ ...acc, [l[chave]]: (acc[l[chave]] || 0) + Number(l.total) }), {}));
  const total = (linhas || []).reduce((t, l) => t + Number(l.total), 0);
  // Tempo médio até "Resolvida"/"Encerrada", pesado pelo número de pedidos de cada grupo.
  const comTempo = (linhas || []).filter((l) => l.horas_resolucao != null);
  const pedidosComTempo = comTempo.reduce((t, l) => t + Number(l.total), 0);
  const horasMedias = pedidosComTempo ? comTempo.reduce((t, l) => t + Number(l.horas_resolucao) * Number(l.total), 0) / pedidosComTempo : null;
  const tempo = horasMedias == null ? '—' : horasMedias < 48 ? `${Math.round(horasMedias)} h` : `${(horasMedias / 24).toFixed(1)} dias`;
  const meses = somar('mes').sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12);
  const nomeMes = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

  return (
    <main className="container admin">
      <p className="admin__migalhas">Painel / Atendimentos</p>
      <h1 className="admin__titulo">Relatório de atendimento</h1>
      <p className="texto" style={{ marginBottom: 20 }}>Números dos pedidos dos cidadãos. Os dados pessoais só são visíveis para a equipa de Atendimento.</p>
      {linhas === null && <p className="vazio">A carregar…</p>}
      {erro && <p className="vazio">{erro}</p>}
      {linhas && !erro && (
        <>
          <section className="contadores" aria-label="Por estado">
            <div className="contador"><span>Total</span><strong>{total}</strong></div>
            <div className="contador"><span>Tempo médio de resolução</span><strong>{tempo}</strong></div>
            {somar('status').map(([estado, n]) => <div className="contador" key={estado}><span>{estado}</span><strong>{n}</strong></div>)}
          </section>
          <div className="admin__colunas">
            <section className="painel" style={{ flex: '1 1 320px' }}>
              <div className="painel__topo"><h2>Por assunto</h2></div>
              <table className="tabela"><tbody>
                {somar('assunto').sort((a, b) => b[1] - a[1]).map(([assunto, n]) => <tr key={assunto}><td>{assunto}</td><td style={{ textAlign: 'right' }}><strong>{n}</strong></td></tr>)}
              </tbody></table>
            </section>
            <section className="painel" style={{ flex: '1 1 320px' }}>
              <div className="painel__topo"><h2>Por prioridade</h2></div>
              <table className="tabela"><tbody>
                {PRIORIDADES.map((pr) => [pr, somar('prioridade').find(([k]) => k === pr)?.[1] || 0]).map(([pr, n]) => <tr key={pr}><td>{pr}</td><td style={{ textAlign: 'right' }}><strong>{n}</strong></td></tr>)}
              </tbody></table>
            </section>
            <section className="painel" style={{ flex: '1 1 320px' }}>
              <div className="painel__topo"><h2>Por mês</h2></div>
              <table className="tabela"><tbody>
                {meses.map(([mes, n]) => <tr key={mes}><td>{nomeMes(mes)}</td><td style={{ textAlign: 'right' }}><strong>{n}</strong></td></tr>)}
              </tbody></table>
            </section>
          </div>
        </>
      )}
    </main>
  );
}

const PAPEIS_PAGINA = ['super_admin', 'atendimento', 'gestor'];

export default function Atendimentos() {
  const { sessao, perfil } = useAcesso();
  // Quem não trabalha com atendimentos (ex.: Editor) vai para a sua primeira página do painel.
  useEffect(() => { if (perfil && !pode(perfil, PAPEIS_PAGINA)) location.replace(primeiraPagina(perfil)); }, [perfil]);
  if (sessao === undefined) return null;
  if (!sessao) return <Entrada />;
  return (
    <Painel papeis={PAPEIS_PAGINA} activa="./">
      {({ perfil: p, sessao: ses }) => (p.papel === 'gestor' ? <Relatorio /> : <Lista perfil={p} sessao={ses} />)}
    </Painel>
  );
}
