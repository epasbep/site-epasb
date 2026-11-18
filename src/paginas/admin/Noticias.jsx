// Painel administrativo: lista de notícias, com editar e apagar.
import { useEffect, useState } from 'react';
import { sb } from '../../supabase.js';
import { ficheirosNoStorage } from '../../api.js';
import { formatarData, miniatura, pub } from '../../util.js';
import { useSessao, Topo } from '../../componentes/Admin.jsx';

function Lista({ sessao }) {
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState('');

  async function carregar() {
    setErro('');
    const { data, error } = await sb.from('noticias').select('*').order('date', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
    if (error) {
      setErro(/noticias/.test(error.message)
        ? 'A tabela de notícias ainda não existe. Corra o ficheiro supabase/instalar.sql no Supabase (ver supabase/LEIA-ME.md).'
        : 'Erro ao carregar notícias: ' + error.message);
    }
    setLista(data || []);
  }
  useEffect(() => { carregar(); }, []);

  async function apagar(n) {
    if (!confirm(`Apagar a notícia «${n.title}»?\n\nDeixa de aparecer no site e as fotografias carregadas pelo painel são eliminadas. Esta acção não pode ser desfeita.`)) return;
    const { error } = await sb.from('noticias').delete().eq('id', n.id);
    if (error) { setErro('Não foi possível apagar: ' + error.message); return; }
    const ficheiros = ficheirosNoStorage([...(n.photos || []), n.video?.type === 'file' ? n.video.src : null]);
    if (ficheiros.length) await sb.storage.from('noticias').remove(ficheiros).catch(() => {});
    carregar();
  }

  return (
    <>
      <Topo sessao={sessao} activa="noticias.html" />
      <main className="container admin">
        <p className="admin__migalhas">Painel / Notícias</p>
        <div className="seccao__topo seccao__topo--linha">
          <h1 className="admin__titulo" style={{ margin: 0 }}>Notícias</h1>
          <a className="btn btn--primario" href="nova-noticia.html">Publicar notícia</a>
        </div>
        <section className="painel">
          {lista === null && <p className="vazio" style={{ border: 0 }}>A carregar notícias…</p>}
          {erro && <p className="vazio" style={{ border: 0 }}>{erro}</p>}
          {lista?.length === 0 && !erro && <p className="vazio" style={{ border: 0 }}>Ainda não há notícias. Publique a primeira.</p>}
          {lista?.length > 0 && (
            <div className="lista-admin">
              {lista.map((n) => (
                <div className="lista-admin__item" key={n.id}>
                  {n.photos?.[0] ? <img src={miniatura(pub(n.photos[0]))} alt="" loading="lazy" /> : <img alt="" />}
                  <div className="lista-admin__texto">
                    <strong>{n.title}</strong>
                    <span>{[formatarData(n.date) || 'Sem data', n.author, `${n.photos?.length || 0} fotografias`, n.video ? 'vídeo' : ''].filter(Boolean).join(' · ')}</span>
                  </div>
                  <div className="botoes">
                    <a className="btn btn--secundario" href={`../noticia.html?id=${encodeURIComponent(n.id)}`} target="_blank" rel="noopener">Ver</a>
                    <a className="btn btn--primario" href={`nova-noticia.html?id=${encodeURIComponent(n.id)}`}>Editar</a>
                    <button className="btn btn--perigo" type="button" onClick={() => apagar(n)}>Apagar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default function Noticias() {
  const sessao = useSessao();
  useEffect(() => { if (sessao === null) location.replace('index.html'); }, [sessao]);
  return sessao ? <Lista sessao={sessao} /> : null;
}
