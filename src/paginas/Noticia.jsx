// Página de uma notícia: título, resumo, autor, carrossel único no topo e texto sem interrupções.
import { useEffect, useState } from 'react';
import { getNews } from '../api.js';
import { formatarData, pub } from '../util.js';
import { Carrossel } from '../componentes/Carrossel.jsx';

export default function Noticia() {
  const [n, setN] = useState(undefined); // undefined = a carregar, null = não existe

  useEffect(() => {
    const id = new URLSearchParams(location.search).get('id');
    (id ? getNews(id) : Promise.resolve(null)).then((noticia) => {
      setN(noticia);
      if (noticia) {
        document.title = `${noticia.title} | EPASB-EP`;
        document.querySelector('meta[name="description"]')?.setAttribute('content', noticia.short || '');
      }
    });
  }, []);

  return (
    <main id="conteudo" className="noticia" aria-live="polite">
      <a className="noticia__voltar" href="noticias.html">← Todas as notícias</a>
      {n === undefined && <p className="vazio" style={{ marginTop: 16 }}>A carregar notícia…</p>}
      {n === null && <p className="vazio" style={{ marginTop: 16 }}>Não encontrámos esta notícia. Pode ter sido removida.</p>}
      {n && (
        <article>
          {n.date && <p className="noticia__data"><time dateTime={n.date}>{formatarData(n.date)}</time></p>}
          <h1 className="noticia__titulo">{n.title}</h1>
          <p className="noticia__lead">{n.short}</p>
          <div className="noticia__autor">
            <img src={pub('assets/logo/logo-epasb-128.webp')} width="36" height="36" alt="" />
            <span>Por <strong>{n.author || 'EPASB-EP'}</strong></span>
          </div>
          <Carrossel fotos={n.photos || []} video={n.video} />
          <div className="noticia__corpo">
            {(n.body || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
            {n.source && <p><a href={n.source} target="_blank" rel="noopener noreferrer">Ver a publicação original no Facebook →</a></p>}
          </div>
        </article>
      )}
    </main>
  );
}
