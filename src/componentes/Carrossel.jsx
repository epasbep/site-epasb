// Carrossel de media de uma notícia: scroll-snap nativo (desliza com o dedo, sem bibliotecas),
// vídeo primeiro, YouTube que só carrega ao tocar e fotografias que ampliam em ecrã inteiro.
import { useEffect, useRef, useState } from 'react';
import { contarFotos, fonteFoto, movimentoReduzido, pub } from '../util.js';

function Lightbox({ fotos, indice, mudar, fechar }) {
  const botaoFechar = useRef(null);
  const accoes = useRef({ fechar, mudar });
  accoes.current = { fechar, mudar };
  useEffect(() => {
    const anterior = document.activeElement;
    botaoFechar.current?.focus();
    const tecla = (e) => {
      if (e.key === 'Escape') accoes.current.fechar();
      if (e.key === 'ArrowLeft') accoes.current.mudar(-1);
      if (e.key === 'ArrowRight') accoes.current.mudar(1);
    };
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('keydown', tecla); anterior?.focus?.(); };
  }, []);

  const parar = (e) => e.stopPropagation();
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Fotografia ampliada" onClick={fechar}>
      <img src={pub(fotos[indice])} alt="" onClick={parar} />
      <div className="lightbox__barra" onClick={parar}>
        {fotos.length > 1 && <button type="button" aria-label="Anterior" onClick={() => mudar(-1)}>←</button>}
        <span>{indice + 1} / {fotos.length}</span>
        {fotos.length > 1 && <button type="button" aria-label="Seguinte" onClick={() => mudar(1)}>→</button>}
        <button type="button" aria-label="Fechar" ref={botaoFechar} onClick={fechar}>×</button>
      </div>
    </div>
  );
}

export function Carrossel({ fotos, video }) {
  const pista = useRef(null);
  const [actual, setActual] = useState(0);
  const [aTocar, setATocar] = useState(false); // YouTube já carregado?
  const [ampliada, setAmpliada] = useState(null);

  const total = fotos.length + (video ? 1 : 0);
  const multi = total > 1;
  const poster = pub(video?.poster || fotos[0] || '');

  const ir = (i) => pista.current.scrollTo({ left: i * pista.current.clientWidth, behavior: movimentoReduzido() ? 'auto' : 'smooth' });
  const aoRolar = () => {
    const el = pista.current;
    const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    if (i === actual) return;
    setActual(i);
    setATocar(false); // ao mudar de slide o YouTube volta ao poster
    el.querySelector('video')?.pause();
  };

  if (!total) return null;
  const legenda = [video ? '1 vídeo' : '', fotos.length ? contarFotos(fotos.length) : ''].filter(Boolean).join(' · ');

  return (
    <figure>
      <div className="carrossel">
        <div className="carrossel__pista" ref={pista} onScroll={aoRolar} tabIndex={0} aria-label="Fotografias e vídeo da notícia">
          {video?.type === 'youtube' && (
            <div className="carrossel__slide">
              {aTocar ? (
                <iframe src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}?autoplay=1&rel=0&playsinline=1`}
                  title="Vídeo da notícia" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" />
              ) : (
                <button className="yt-facade" type="button" aria-label="Reproduzir vídeo do YouTube" onClick={() => setATocar(true)}>
                  <img src={poster} alt="" />
                  <span className="yt-facade__play" />
                  <span className="yt-facade__nota">YouTube · só carrega ao tocar</span>
                </button>
              )}
            </div>
          )}
          {video?.type === 'file' && (
            <div className="carrossel__slide"><video controls playsInline preload="none" poster={poster} src={pub(video.src)} /></div>
          )}
          {fotos.map((url, i) => (
            <div className="carrossel__slide" key={url + i}>
              <button className="carrossel__ampliar" type="button" aria-label={`Ampliar fotografia ${i + 1}`} onClick={() => setAmpliada(i)}>
                <img {...fonteFoto(url, '(min-width: 820px) 760px, 100vw')} alt="" loading={i || video ? 'lazy' : 'eager'} decoding="async" />
              </button>
            </div>
          ))}
        </div>
        {multi && <span className="carrossel__contador">{actual + 1} / {total}</span>}
        {multi && actual > 0 && <button className="carrossel__seta carrossel__seta--ant" type="button" aria-label="Anterior" onClick={() => ir(actual - 1)}>←</button>}
        {multi && actual < total - 1 && <button className="carrossel__seta carrossel__seta--seg" type="button" aria-label="Seguinte" onClick={() => ir(actual + 1)}>→</button>}
      </div>
      <figcaption>
        <span>{legenda}</span>
        {multi && (
          <span className="carrossel__pontos">
            {Array.from({ length: total }, (_, i) => (
              <button key={i} className="carrossel__ponto" type="button" aria-label={`Ir para ${i + 1} de ${total}`}
                aria-current={i === actual} onClick={() => ir(i)} />
            ))}
          </span>
        )}
      </figcaption>
      {ampliada !== null && (
        <Lightbox fotos={fotos} indice={ampliada} fechar={() => setAmpliada(null)}
          mudar={(d) => setAmpliada((n) => (n + d + fotos.length) % fotos.length)} />
      )}
    </figure>
  );
}
