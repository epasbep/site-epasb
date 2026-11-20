// Painel administrativo: notícias, com o fluxo Editor → Gestor → publicação.
//   Editor: cria, edita as suas (enquanto não estão publicadas) e envia para revisão.
//   Gestor e Super Administrador: aprovam e publicam, devolvem com uma nota, editam e apagam.
import { useEffect, useState } from 'react';
import { sb } from '../../supabase.js';
import { ficheirosNoStorage } from '../../api.js';
import { formatarData, miniatura, pub } from '../../util.js';
import { Painel, pode } from '../../componentes/Admin.jsx';

export const ESTADOS_NOTICIA = {
  rascunho: ['Rascunho', 'estado--encerrado'],
  revisao: ['Para rever', 'estado--analise'],
  devolvido: ['Devolvida', 'estado--curso'],
  publicado: ['Publicada', 'estado--respondido']
};
const FILTROS = [['todas', 'Todas'], ['revisao', 'Para rever'], ['rascunho', 'Rascunhos'], ['devolvido', 'Devolvidas'], ['publicado', 'Publicadas']];

function Lista({ sessao, perfil }) {
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState(pode(perfil, ['super_admin', 'gestor']) ? 'revisao' : 'todas');
  const aprova = pode(perfil, ['super_admin', 'gestor']);
  const meu = (n) => n.criado_por === sessao.user.id;

  async function carregar() {
    setErro('');
    const { data, error } = await sb.from('noticias').select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setErro(/estado|noticias/.test(error.message)
        ? 'A base de dados ainda não está preparada. Corra supabase/instalar.sql e supabase/fase1-papeis.sql (ver supabase/LEIA-ME.md).'
        : 'Erro ao carregar notícias: ' + error.message);
    }
    setLista(data || []);
  }
  useEffect(() => { carregar(); }, []);

  async function mudarEstado(n, estado, nota = null) {
    const { error } = await sb.from('noticias').update({ estado, nota_revisao: nota }).eq('id', n.id);
    if (error) setErro('Não foi possível alterar: ' + error.message); else carregar();
  }
  const aprovar = (n) => { if (confirm(`Publicar «${n.title}» no site?`)) mudarEstado(n, 'publicado'); };
  const devolver = (n) => {
    const nota = prompt('O que deve ser corrigido? (o Editor vê esta nota)');
    if (nota !== null) mudarEstado(n, 'devolvido', nota.trim() || 'Rever antes de publicar.');
  };
  const despublicar = (n) => { if (confirm(`Retirar «${n.title}» do site? Fica como rascunho.`)) mudarEstado(n, 'rascunho'); };

  async function apagar(n) {
    if (!confirm(`Apagar a notícia «${n.title}»?\n\nAs fotografias carregadas pelo painel também são eliminadas. Esta acção não pode ser desfeita.`)) return;
    const { error } = await sb.from('noticias').delete().eq('id', n.id);
    if (error) { setErro('Não foi possível apagar: ' + error.message); return; }
    const ficheiros = ficheirosNoStorage([...(n.photos || []), n.video?.type === 'file' ? n.video.src : null]);
    if (ficheiros.length) await sb.storage.from('noticias').remove(ficheiros).catch(() => {});
    carregar();
  }

  const conta = (e) => (lista || []).filter((n) => e === 'todas' || n.estado === e).length;
  const visiveis = (lista || []).filter((n) => filtro === 'todas' || n.estado === filtro);
  const podeEditar = (n) => aprova || (meu(n) && n.estado !== 'publicado');

  return (
    <main className="container admin">
      <p className="admin__migalhas">Painel / Notícias</p>
      <div className="seccao__topo seccao__topo--linha">
        <h1 className="admin__titulo" style={{ margin: 0 }}>Notícias</h1>
        <a className="btn btn--primario" href="nova-noticia.html">{aprova ? 'Publicar notícia' : 'Escrever notícia'}</a>
      </div>
      {!aprova && <p className="texto" style={{ marginBottom: 16 }}>As notícias que escrever ficam publicadas depois de um Gestor as aprovar.</p>}
      <div className="filtros" role="group" aria-label="Filtrar notícias">
        {FILTROS.map(([id, nome]) => (
          <button key={id} type="button" aria-pressed={filtro === id} onClick={() => setFiltro(id)}>{nome} ({conta(id)})</button>
        ))}
      </div>
      <section className="painel">
        {lista === null && <p className="vazio" style={{ border: 0 }}>A carregar notícias…</p>}
        {erro && <p className="vazio" style={{ border: 0 }}>{erro}</p>}
        {lista && !erro && visiveis.length === 0 && <p className="vazio" style={{ border: 0 }}>Nenhuma notícia neste filtro.</p>}
        {visiveis.length > 0 && (
          <div className="lista-admin">
            {visiveis.map((n) => {
              const [estado, classe] = ESTADOS_NOTICIA[n.estado] || ESTADOS_NOTICIA.publicado;
              return (
                <div className="lista-admin__item" key={n.id}>
                  {n.photos?.[0] ? <img src={miniatura(pub(n.photos[0]))} alt="" loading="lazy" /> : <img alt="" />}
                  <div className="lista-admin__texto">
                    <strong>{n.title}</strong>
                    <span><span className={`estado ${classe}`}>{estado}</span> {[formatarData(n.date) || 'Sem data', n.author, meu(n) ? 'escrita por si' : ''].filter(Boolean).join(' · ')}</span>
                    {n.estado === 'devolvido' && n.nota_revisao && <span style={{ display: 'block', color: 'var(--aviso)' }}>Nota do Gestor: {n.nota_revisao}</span>}
                  </div>
                  <div className="botoes">
                    {n.estado === 'publicado' && <a className="btn btn--secundario" href={`../noticia.html?id=${encodeURIComponent(n.id)}`} target="_blank" rel="noopener">Ver</a>}
                    {podeEditar(n) && <a className="btn btn--secundario" href={`nova-noticia.html?id=${encodeURIComponent(n.id)}`}>Editar</a>}
                    {aprova && n.estado === 'revisao' && <button className="btn btn--primario" type="button" onClick={() => aprovar(n)}>Aprovar e publicar</button>}
                    {aprova && n.estado === 'revisao' && <button className="btn btn--secundario" type="button" onClick={() => devolver(n)}>Devolver</button>}
                    {aprova && n.estado === 'publicado' && <button className="btn btn--secundario" type="button" onClick={() => despublicar(n)}>Retirar do site</button>}
                    {podeEditar(n) && <button className="btn btn--perigo" type="button" onClick={() => apagar(n)}>Apagar</button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default function Noticias() {
  return (
    <Painel papeis={['super_admin', 'gestor', 'editor']} activa="noticias.html">
      {({ sessao, perfil }) => <Lista sessao={sessao} perfil={perfil} />}
    </Painel>
  );
}
