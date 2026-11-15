// Painel administrativo: entrada (login) e gestão dos atendimentos ao cidadão.
import { useEffect, useRef, useState } from 'react';
import { sb } from '../../supabase.js';
import { pub } from '../../util.js';
import { useSessao, Topo } from '../../componentes/Admin.jsx';

const ESTADOS = ['Novo', 'Em análise', 'Respondido', 'Encerrado'];
const CLASSES = { 'Em análise': 'estado--analise', Respondido: 'estado--respondido', Encerrado: 'estado--encerrado' };
const dataHora = (iso) => (iso ? new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : '-');

function Entrada() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [aEntrar, setAEntrar] = useState(false);

  async function entrar(ev) {
    ev.preventDefault();
    setErro('');
    setAEntrar(true);
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: senha });
    setAEntrar(false);
    if (error) setErro('Não foi possível iniciar sessão. Verifique o email e a palavra-passe.');
    // Em caso de sucesso, useSessao() recebe a sessão e o painel aparece.
  }

  return (
    <section className="login">
      <form className="form" onSubmit={entrar}>
        <img className="login__logo" src={pub('assets/logo/logo-epasb-256.webp')} width="96" height="96" alt="EPASB-EP" />
        <h1>Área administrativa</h1>
        <p className="texto">Atendimento ao cidadão e notícias</p>
        <div className="campo">
          <label htmlFor="login-email">Email</label>
          <input className="input" id="login-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="login-senha">Palavra-passe</label>
          <input className="input" id="login-senha" type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
          <p className="campo__erro" role="alert">{erro}</p>
        </div>
        <button className="btn btn--primario" type="submit" disabled={aEntrar}>{aEntrar ? 'A entrar…' : 'Entrar'}</button>
      </form>
    </section>
  );
}

function Detalhe({ atendimento: a, fechar, aoMudar }) {
  const [estado, setEstado] = useState(a.status || 'Novo');
  const [resposta, setResposta] = useState(a.resposta || '');
  const [doc, setDoc] = useState(a.documento_url ? undefined : null); // undefined = a gerar link
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const botaoFechar = useRef(null);

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
    const { error } = await sb.from('atendimentos')
      .update({ status: estado, resposta: resposta.trim(), atualizado_at: new Date().toISOString() }).eq('id', a.id);
    setOcupado(false);
    if (error) { setErro('Não foi possível guardar: ' + error.message); return; }
    aoMudar();
  }

  async function eliminar() {
    if (!confirm(`Eliminar o atendimento #${a.id}?\n\nEsta acção não pode ser desfeita.`)) return;
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
          <h2 id="m-t">Detalhes do atendimento</h2>
          <button className="modal__fechar" type="button" aria-label="Fechar" ref={botaoFechar} onClick={fechar}>×</button>
        </div>
        <dl className="detalhes">
          <div><dt>ID</dt><dd>#{a.id}</dd></div>
          <div><dt>Data</dt><dd>{dataHora(a.created_at)}</dd></div>
          <div><dt>Nome</dt><dd>{a.nome}</dd></div>
          <div><dt>Email</dt><dd>{a.email}</dd></div>
          <div><dt>Telefone</dt><dd>{a.telefone || '-'}</dd></div>
          <div><dt>Assunto</dt><dd>{a.assunto}</dd></div>
          <div className="largo"><dt>Mensagem</dt><dd>{a.mensagem}</dd></div>
          <div className="largo"><dt>Documento anexado</dt><dd>
            {doc === null && 'Nenhum documento anexado.'}
            {doc === undefined && 'A preparar o documento…'}
            {doc === false && 'Não foi possível abrir o documento.'}
            {doc && <a href={doc} target="_blank" rel="noopener noreferrer">Abrir documento</a>}
          </dd></div>
        </dl>
        <div className="campo">
          <label htmlFor="estado">Estado do atendimento</label>
          <select className="select" id="estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
            {ESTADOS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="resposta">Resposta ao cidadão</label>
          <textarea className="textarea" id="resposta" rows="5" value={resposta} onChange={(e) => setResposta(e.target.value)} />
          <p className="campo__erro" role="alert">{erro}</p>
        </div>
        <div className="botoes">
          <button className="btn btn--primario" type="button" disabled={ocupado} onClick={guardar}>Guardar alterações</button>
          <button className="btn btn--perigo" type="button" disabled={ocupado} onClick={eliminar}>Eliminar atendimento</button>
        </div>
      </div>
    </div>
  );
}

function Painel({ sessao }) {
  const [lista, setLista] = useState(null); // null = a carregar
  const [erro, setErro] = useState('');
  const [aberto, setAberto] = useState(null);

  async function carregar() {
    setLista(null);
    setErro('');
    const { data, error } = await sb.from('atendimentos').select('*').order('created_at', { ascending: false });
    if (error) setErro('Erro ao carregar atendimentos: ' + error.message);
    setLista(data || []);
  }
  useEffect(() => { carregar(); }, []);

  const conta = (s) => (lista || []).filter((a) => a.status === s).length;
  const contadores = [['Total', lista?.length ?? 0], ['Novos', conta('Novo')], ['Em análise', conta('Em análise')], ['Respondidos', conta('Respondido')], ['Encerrados', conta('Encerrado')]];

  return (
    <>
      <Topo sessao={sessao} activa="index.html" />
      <main className="container admin">
        <p className="admin__migalhas">Painel / Atendimentos</p>
        <h1 className="admin__titulo">Atendimento ao cidadão</h1>
        <section className="contadores" aria-label="Resumo">
          {contadores.map(([nome, n]) => <div className="contador" key={nome}><span>{nome}</span><strong>{n}</strong></div>)}
        </section>
        <section className="painel">
          <div className="painel__topo">
            <h2>Atendimentos recebidos</h2>
            <button className="btn btn--secundario" type="button" onClick={carregar}>Actualizar</button>
          </div>
          {lista === null && <p className="vazio" style={{ border: 0 }}>A carregar atendimentos…</p>}
          {erro && <p className="vazio" style={{ border: 0 }}>{erro}</p>}
          {lista?.length === 0 && !erro && <p className="vazio" style={{ border: 0 }}>Não existem atendimentos registados.</p>}
          {lista?.length > 0 && (
            <div className="tabela-rolo">
              <table className="tabela">
                <thead><tr><th>ID</th><th>Data</th><th>Nome</th><th>Email</th><th>Assunto</th><th>Estado</th><th>Acção</th></tr></thead>
                <tbody>
                  {lista.map((a) => (
                    <tr key={a.id}>
                      <td>#{a.id}</td><td>{dataHora(a.created_at)}</td><td>{a.nome}</td><td>{a.email}</td><td>{a.assunto}</td>
                      <td><span className={`estado ${CLASSES[a.status] || ''}`}>{a.status || 'Novo'}</span></td>
                      <td><button className="btn btn--primario" type="button" onClick={() => setAberto(a)}>Ver</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      {aberto && <Detalhe key={aberto.id} atendimento={aberto} fechar={() => setAberto(null)} aoMudar={() => { setAberto(null); carregar(); }} />}
    </>
  );
}

export default function Atendimentos() {
  const sessao = useSessao();
  if (sessao === undefined) return null;
  return sessao ? <Painel sessao={sessao} /> : <Entrada />;
}
