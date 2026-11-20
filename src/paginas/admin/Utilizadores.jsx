// Painel administrativo: utilizadores e papéis (só Super Administrador).
// As acções passam pela função "gerir-utilizadores" do Supabase (ver supabase/LEIA-ME.md).
import { useEffect, useState } from 'react';
import { sb } from '../../supabase.js';
import { Painel, PAPEIS } from '../../componentes/Admin.jsx';

const DESCRICAO = {
  super_admin: 'Tudo: utilizadores, auditoria, conteúdos e atendimentos.',
  gestor: 'Notícias, avisos, aprovação de conteúdos e relatório de atendimento.',
  editor: 'Escreve notícias; um Gestor aprova antes de publicar.',
  atendimento: 'Pedidos dos cidadãos: ver, responder e mudar o estado.'
};
const quando = (iso) => (iso ? new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : 'Nunca');

// Palavra-passe temporária aleatória (o utilizador muda-a depois em "A minha conta").
function gerarPalavraPasse() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(14)), (n) => letras[n % letras.length]).join('');
}

async function chamar(corpo) {
  const { data, error } = await sb.functions.invoke('gerir-utilizadores', { body: corpo });
  if (error) {
    const detalhe = await error.context?.json?.().catch(() => null);
    if (!detalhe && /Failed to send|fetch/i.test(error.message)) {
      throw new Error('A função "gerir-utilizadores" ainda não está instalada no Supabase (ver supabase/LEIA-ME.md).');
    }
    throw new Error(detalhe?.erro || error.message);
  }
  return data;
}

const VAZIO = { nome: '', email: '', papel: 'editor', palavraPasse: '' };

function Gestao() {
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [novo, setNovo] = useState(VAZIO);
  const [ocupado, setOcupado] = useState(false);

  async function carregar() {
    try { setLista(await chamar({ accao: 'listar' })); } catch (e) { setErro(e.message); setLista([]); }
  }
  useEffect(() => { carregar(); }, []);

  async function accao(corpo, sucesso) {
    setErro(''); setAviso(''); setOcupado(true);
    try { await chamar(corpo); setAviso(sucesso); await carregar(); return true; }
    catch (e) { setErro(e.message); return false; }
    finally { setOcupado(false); }
  }

  async function criar(ev) {
    ev.preventDefault();
    const ok = await accao({ accao: 'criar', ...novo }, `Conta criada para ${novo.email}. Entregue a palavra-passe temporária à pessoa por um meio seguro.`);
    if (ok) setNovo(VAZIO);
  }
  const mudar = (e) => setNovo((n) => ({ ...n, [e.target.name]: e.target.value }));

  const redefinir = (u) => {
    const nova = prompt(`Nova palavra-passe para ${u.email} (mínimo 10 caracteres):`, gerarPalavraPasse());
    if (nova) accao({ accao: 'palavraPasse', id: u.id, palavraPasse: nova }, `Palavra-passe de ${u.email} alterada.`);
  };
  const remover = (u) => {
    if (confirm(`Remover a conta ${u.email}?\n\nA pessoa deixa de conseguir entrar. Esta acção não pode ser desfeita.`)) {
      accao({ accao: 'remover', id: u.id }, `Conta ${u.email} removida.`);
    }
  };

  return (
    <main className="container admin">
      <p className="admin__migalhas">Painel / Utilizadores</p>
      <h1 className="admin__titulo">Utilizadores e papéis</h1>
      <div aria-live="polite">
        {erro && <p className="mensagem mensagem--erro" style={{ marginBottom: 16 }}>{erro}</p>}
        {aviso && <p className="mensagem mensagem--sucesso" style={{ marginBottom: 16 }}>{aviso}</p>}
      </div>

      <div className="admin__colunas">
        <section className="painel" style={{ flex: '2 1 560px', minWidth: 0 }} aria-labelledby="t-contas">
          <div className="painel__topo"><h2 id="t-contas">Contas</h2></div>
          {lista === null && <p className="vazio" style={{ border: 0 }}>A carregar…</p>}
          <div className="lista-admin">
            {lista?.map((u) => (
              <div className="lista-admin__item" key={u.id} style={{ flexWrap: 'wrap' }}>
                <div className="lista-admin__texto">
                  <strong>{u.nome || u.email}{u.eu && ' (a sua conta)'}</strong>
                  <span>{u.email} · último acesso: {quando(u.ultimoAcesso)}</span>
                  {!u.papel && <span style={{ display: 'block', color: 'var(--aviso)' }}>Sem papel: não consegue usar o painel.</span>}
                  {u.papel && !u.activo && <span style={{ display: 'block', color: 'var(--erro)' }}>Desactivada</span>}
                </div>
                <div className="botoes">
                  <select className="select" aria-label={`Papel de ${u.email}`} style={{ minHeight: 40, width: 'auto' }} disabled={ocupado || u.eu}
                    value={u.papel || ''} onChange={(e) => accao({ accao: 'alterar', id: u.id, papel: e.target.value, activo: true }, `Papel de ${u.email} alterado.`)}>
                    {!u.papel && <option value="">Escolher papel…</option>}
                    {Object.entries(PAPEIS).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
                  </select>
                  {u.papel && !u.eu && (
                    <button className="btn btn--secundario" type="button" disabled={ocupado}
                      onClick={() => accao({ accao: 'alterar', id: u.id, activo: !u.activo }, `Conta ${u.email} ${u.activo ? 'desactivada' : 'activada'}.`)}>
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  )}
                  <button className="btn btn--secundario" type="button" disabled={ocupado} onClick={() => redefinir(u)}>Palavra-passe</button>
                  {!u.eu && <button className="btn btn--perigo" type="button" disabled={ocupado} onClick={() => remover(u)}>Remover</button>}
                </div>
              </div>
            ))}
          </div>
        </section>

        <form className="form admin__previa" style={{ position: 'static' }} onSubmit={criar} noValidate>
          <h2 className="h3">Nova conta</h2>
          <div className="campo"><label htmlFor="u-nome">Nome</label><input className="input" id="u-nome" name="nome" value={novo.nome} onChange={mudar} autoComplete="off" /></div>
          <div className="campo"><label htmlFor="u-email">Email *</label><input className="input" id="u-email" name="email" type="email" value={novo.email} onChange={mudar} autoComplete="off" /></div>
          <div className="campo">
            <label htmlFor="u-papel">Papel *</label>
            <select className="select" id="u-papel" name="papel" value={novo.papel} onChange={mudar}>
              {Object.entries(PAPEIS).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
            </select>
            <p className="campo__ajuda" style={{ marginTop: 6 }}>{DESCRICAO[novo.papel]}</p>
          </div>
          <div className="campo">
            <label htmlFor="u-senha">Palavra-passe temporária *</label>
            <div className="botoes" style={{ flexWrap: 'nowrap' }}>
              <input className="input" id="u-senha" name="palavraPasse" value={novo.palavraPasse} onChange={mudar} autoComplete="new-password" spellCheck="false" />
              <button className="btn btn--secundario" type="button" onClick={() => setNovo((n) => ({ ...n, palavraPasse: gerarPalavraPasse() }))}>Gerar</button>
            </div>
            <p className="campo__ajuda" style={{ marginTop: 6 }}>Mínimo 10 caracteres. A pessoa deve mudá-la em «A minha conta» no primeiro acesso.</p>
          </div>
          <div className="form__accoes"><button className="btn btn--primario" type="submit" disabled={ocupado}>{ocupado ? 'A guardar…' : 'Criar conta'}</button></div>
        </form>
      </div>
    </main>
  );
}

export default function Utilizadores() {
  return <Painel papeis={['super_admin']} activa="utilizadores.html">{() => <Gestao />}</Painel>;
}
