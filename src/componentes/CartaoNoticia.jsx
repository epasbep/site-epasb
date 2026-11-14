// Cartão de notícia (página Notícias e página inicial) e o carregamento da lista.
import { useEffect, useState } from 'react';
import { listNews } from '../api.js';
import { formatarData, contarFotos, fonteFoto } from '../util.js';

export function CartaoNoticia({ noticia: n }) {
  const fotos = n.photos || [];
  const meta = [formatarData(n.date), contarFotos(fotos.length)].filter(Boolean).join(' · ');
  return (
    <a className="cartao" href={`noticia.html?id=${encodeURIComponent(n.id)}`}>
      <div className="cartao__media">
        {fotos[0] && <img {...fonteFoto(fotos[0], '(min-width: 700px) 380px, 100vw')} alt="" loading="lazy" decoding="async" />}
        <div className="cartao__badges">
          {n.video && <span className="badge badge--video">▶ Vídeo</span>}
          {fotos.length > 1 && <span className="badge">{contarFotos(fotos.length)}</span>}
        </div>
      </div>
      <div className="cartao__corpo">
        <p className="cartao__meta">{meta}</p>
        <h3 className="cartao__titulo">{n.title}</h3>
        <p className="cartao__resumo">{n.short}</p>
        <span className="cartao__mais">Ler notícia →</span>
      </div>
    </a>
  );
}

// Grelha de notícias. "limite" mostra só as mais recentes (página inicial).
export function GrelhaNoticias({ limite }) {
  const [noticias, setNoticias] = useState(null);
  useEffect(() => { listNews().then(setNoticias); }, []);
  return (
    <div className="grelha" aria-live="polite">
      {noticias === null && <p className="vazio">A carregar notícias…</p>}
      {noticias?.length === 0 && <p className="vazio">Ainda não há notícias publicadas.</p>}
      {(limite ? noticias?.slice(0, limite) : noticias)?.map((n) => <CartaoNoticia key={n.id} noticia={n} />)}
    </div>
  );
}
