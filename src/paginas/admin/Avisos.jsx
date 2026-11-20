// Painel administrativo: avisos da faixa no topo do site (interrupções, avisos urgentes).
import { useEffect, useState } from 'react';
import { sb } from '../../supabase.js';
import { Painel } from '../../componentes/Admin.jsx';

const VAZIO = { texto: '', tipo: 'informacao', link: '', fim: '' };
const quando = (iso) => (iso ? new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : '');

function estadoDe(a) {
  if (!a.activo) return ['Escondido', 'estado--encerrado'];
  if (a.fim && new Date(a.fim) <= new Date()) return ['Terminado', 'estado--encerrado'];
  return ['No site', 'estado--respondido'];
}

function Gestao() {
  const [lista, setLista] = useState(null);
  const [novo, setNovo] = useState(VAZIO);
  const [erro, setErro] = useState('');
  const [aGuardar, setAGuardar] = useState(false);

  async function carregar() {
    const { data, error } = await sb.from('avisos').select('*').order('created_at', { ascending: false });
    if (error) {
      setErro(/avisos/.test(error.message)
        ? 'A tabela de avisos ainda não existe. Corra o ficheiro supabase/instalar.sql no Supabase (ver supabase/LEIA-ME.md).'
        : 'Erro ao carregar avisos: ' + error.message);
    }
    setLista(data || []);
  }
  useEffect(() => { carregar(); }, []);

  async function criar(ev) {
    ev.preventDefault();
    setErro('');
    if (!novo.texto.trim()) { setErro('Escreva o texto do aviso.'); return; }
    setAGuardar(true);
    const { error } = await sb.from('avisos').insert({
      texto: novo.texto.trim(), tipo: novo.tipo, link: novo.link.trim() || null,
      fim: novo.fim ? new Date(novo.fim).toISOString() : null
    });
    setAGuardar(false);
    if (error) { setErro('Não foi possível publicar o aviso: ' + error.message); return; }
    setNovo(VAZIO);
    carregar();
  }

  async function alternar(a) {
    const { error } = await sb.from('avisos').update({ activo: !a.activo }).eq('id', a.id);
    if (error) setErro('Não foi possível alterar: ' + error.message); else carregar();
  }
  async function apagar(a) {
    if (!confirm('Apagar este aviso? Esta acção não pode ser desfeita.')) return;
    const { error } = await sb.from('avisos').delete().eq('id', a.id);
    if (error) setErro('Não foi possível apagar: ' + error.message); else carregar();
  }

  const mudar = (e) => setNovo((n) => ({ ...n, [e.target.name]: e.target.value }));

  return (
    <>
      <main className="container admin">
        <p className="admin__migalhas">Painel / Avisos</p>
        <h1 className="admin__titulo">Avisos no topo do site</h1>
        <div className="admin__colunas">
          <form className="form" onSubmit={criar} noValidate>
            <h2 className="h3">Novo aviso</h2>
            <div className="campo">
              <div className="campo__topo"><label htmlFor="a-texto">Texto *</label><span className="campo__contador">{novo.texto.length}/220</span></div>
              <textarea className="textarea" id="a-texto" name="texto" rows="3" maxLength={220} value={novo.texto} onChange={mudar}
                placeholder="Ex.: Interrupção do abastecimento no Lobito, sábado das 6h às 18h." />
            </div>
            <div className="campo">
              <label htmlFor="a-tipo">Tipo</label>
              <select className="select" id="a-tipo" name="tipo" value={novo.tipo} onChange={mudar}>
                <option value="informacao">Informação (azul)</option>
                <option value="urgente">Urgente (laranja)</option>
              </select>
            </div>
            <div className="campo">
              <label htmlFor="a-link">Ligação para saber mais (opcional)</label>
              <input className="input" id="a-link" name="link" type="url" inputMode="url" value={novo.link} onChange={mudar} placeholder="Ex.: endereço da notícia" />
            </div>
            <div className="campo">
              <label htmlFor="a-fim">Deixa de aparecer em (opcional)</label>
              <input className="input" id="a-fim" name="fim" type="datetime-local" value={novo.fim} onChange={mudar} />
              <p className="campo__ajuda" style={{ marginTop: 6 }}>Sem data, o aviso fica até o esconder ou apagar.</p>
            </div>
            <p className="campo__erro" role="alert">{erro}</p>
            <div className="form__accoes"><button className="btn btn--primario" type="submit" disabled={aGuardar}>{aGuardar ? 'A publicar…' : 'Publicar aviso'}</button></div>
          </form>

          <section className="painel admin__previa" style={{ position: 'static' }} aria-labelledby="t-avisos">
            <div className="painel__topo"><h2 id="t-avisos">Avisos publicados</h2></div>
            {lista === null && <p className="vazio" style={{ border: 0 }}>A carregar…</p>}
            {lista?.length === 0 && <p className="vazio" style={{ border: 0 }}>Nenhum aviso.</p>}
            <div className="lista-admin">
              {lista?.map((a) => {
                const [estado, classe] = estadoDe(a);
                return (
                  <div className="lista-admin__item" key={a.id} style={{ flexWrap: 'wrap' }}>
                    <div className="lista-admin__texto">
                      <span className={`estado ${classe}`} style={{ marginBottom: 6 }}>{estado}</span>{' '}
                      {a.tipo === 'urgente' && <span className="estado estado--analise">Urgente</span>}
                      <p style={{ marginTop: 6 }}>{a.texto}</p>
                      <span>{a.fim ? `Até ${quando(a.fim)}` : 'Sem data de fim'}</span>
                    </div>
                    <div className="botoes" style={{ width: '100%' }}>
                      <button className="btn btn--secundario" type="button" onClick={() => alternar(a)}>{a.activo ? 'Esconder' : 'Mostrar'}</button>
                      <button className="btn btn--perigo" type="button" onClick={() => apagar(a)}>Apagar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default function Avisos() {
  return <Painel papeis={['super_admin', 'gestor']} activa="avisos">{() => <Gestao />}</Painel>;
}
