// Carrossel leve com scroll-snap nativo, facade de YouTube e ampliação de fotografias.
// Estrutura: .carrossel > .carrossel__pista > .carrossel__slide*, setas, contador; pontos em [data-pontos] ao lado.

export function iniciarCarrossel(raiz) {
  const pista = raiz.querySelector('.carrossel__pista');
  const slides = [...pista.children];
  const ant = raiz.querySelector('.carrossel__seta--ant');
  const seg = raiz.querySelector('.carrossel__seta--seg');
  const cont = raiz.querySelector('.carrossel__contador');
  const pontosEl = raiz.parentElement.querySelector('[data-pontos]');
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const multi = slides.length > 1;
  [ant, seg, cont, pontosEl].forEach((el) => el && (el.hidden = !multi));
  if (!multi) return;

  const ir = (i) => pista.scrollTo({ left: i * pista.clientWidth, behavior: reduzido ? 'auto' : 'smooth' });
  const pontos = slides.map((_, i) => {
    const b = document.createElement('button');
    b.className = 'carrossel__ponto';
    b.type = 'button';
    b.setAttribute('aria-label', `Ir para ${i + 1} de ${slides.length}`);
    b.onclick = () => ir(i);
    pontosEl.appendChild(b);
    return b;
  });

  let atual = -1;
  const actualizar = () => {
    const i = Math.round(pista.scrollLeft / Math.max(1, pista.clientWidth));
    if (i === atual) return;
    if (atual >= 0) pararVideo(slides[atual]);
    atual = i;
    cont.textContent = `${i + 1} / ${slides.length}`;
    ant.hidden = i === 0;
    seg.hidden = i === slides.length - 1;
    pontos.forEach((p, k) => p.setAttribute('aria-current', String(k === i)));
  };
  ant.onclick = () => ir(atual - 1);
  seg.onclick = () => ir(atual + 1);
  pista.addEventListener('scroll', () => requestAnimationFrame(actualizar), { passive: true });
  actualizar();
}

// YouTube: só injecta o iframe ao tocar (poupa dados móveis).
export function iniciarFacades(raiz = document) {
  raiz.querySelectorAll('.yt-facade').forEach((btn) => {
    const original = btn.cloneNode(true);
    btn.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(btn.dataset.yt)}?autoplay=1&rel=0&playsinline=1`;
      f.title = 'Vídeo da notícia';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      f._facade = original;
      btn.replaceWith(f);
    });
  });
}

function pararVideo(slide) {
  slide.querySelector('video')?.pause();
  const f = slide.querySelector('iframe');
  if (f?._facade) { // volta ao poster, para o vídeo não continuar a gastar dados
    const facade = f._facade.cloneNode(true);
    f.replaceWith(facade);
    iniciarFacades(slide);
  }
}

// Ampliar fotografias em ecrã inteiro. urls = lista de fotografias; botoes = elementos que abrem cada uma.
export function iniciarLightbox(urls, botoes) {
  let i = 0, caixa = null, anterior = null;
  const fechar = () => { caixa?.remove(); caixa = null; document.removeEventListener('keydown', tecla); anterior?.focus(); };
  const mostrar = () => {
    caixa.querySelector('img').src = urls[i];
    caixa.querySelector('span').textContent = `${i + 1} / ${urls.length}`;
  };
  const mover = (d) => { i = (i + d + urls.length) % urls.length; mostrar(); };
  const tecla = (e) => {
    if (e.key === 'Escape') fechar();
    if (e.key === 'ArrowLeft') mover(-1);
    if (e.key === 'ArrowRight') mover(1);
  };
  const abrir = (n) => {
    i = n;
    anterior = document.activeElement;
    caixa = document.createElement('div');
    caixa.className = 'lightbox';
    caixa.setAttribute('role', 'dialog');
    caixa.setAttribute('aria-modal', 'true');
    caixa.setAttribute('aria-label', 'Fotografia ampliada');
    caixa.innerHTML = `<img alt=""><div class="lightbox__barra">
      <button type="button" data-d="-1" aria-label="Anterior">←</button><span></span>
      <button type="button" data-d="1" aria-label="Seguinte">→</button>
      <button type="button" data-fechar aria-label="Fechar">×</button></div>`;
    caixa.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b?.dataset.d) mover(Number(b.dataset.d));
      else if (!e.target.closest('img')) fechar();
    });
    if (urls.length < 2) caixa.querySelectorAll('[data-d]').forEach((b) => (b.hidden = true));
    document.body.appendChild(caixa);
    document.addEventListener('keydown', tecla);
    mostrar();
    caixa.querySelector('[data-fechar]').focus();
  };
  botoes.forEach((b, n) => b.addEventListener('click', () => abrir(n)));
}
