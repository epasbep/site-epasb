// Página de uma notícia: título, resumo, autor, carrossel único no topo e texto sem interrupções.
import { getNews } from './api.js';
import { esc, formatarData, contarFotos, fonteFoto } from './util.js';
import { iniciarCarrossel, iniciarFacades, iniciarLightbox } from './carrossel.js';

const main = document.getElementById('conteudo');
const id = new URLSearchParams(location.search).get('id');
const n = id ? await getNews(id) : null;

if (!n) {
  main.innerHTML = `<a class="noticia__voltar" href="noticias.html">← Todas as notícias</a>
    <p class="vazio" style="margin-top:16px">Não encontrámos esta notícia. Pode ter sido removida.</p>`;
} else {
  const fotos = n.photos || [];
  const v = n.video;
  const slides = [];

  if (v?.type === 'youtube') {
    slides.push(`<button class="yt-facade" type="button" data-yt="${esc(v.id)}" aria-label="Reproduzir vídeo do YouTube">
      <img src="${esc(v.poster || fotos[0] || '')}" alt=""><span class="yt-facade__play"></span>
      <span class="yt-facade__nota">YouTube · só carrega ao tocar</span></button>`);
  } else if (v?.type === 'file') {
    slides.push(`<video controls playsinline preload="none" poster="${esc(v.poster || fotos[0] || '')}" src="${esc(v.src)}"></video>`);
  }
  fotos.forEach((url, i) => slides.push(`<button class="carrossel__ampliar" type="button" data-foto aria-label="Ampliar fotografia ${i + 1}">
    <img ${fonteFoto(url, '(min-width: 820px) 760px, 100vw')} alt="" ${i || v ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"></button>`));

  const legenda = [v ? '1 vídeo' : '', fotos.length ? contarFotos(fotos.length) : ''].filter(Boolean).join(' · ');
  const paragrafos = (n.body || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  document.title = `${n.title} | EPASB-EP`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', n.short || '');

  main.innerHTML = `
    <a class="noticia__voltar" href="noticias.html">← Todas as notícias</a>
    <article>
      ${n.date ? `<p class="noticia__data"><time datetime="${esc(n.date)}">${formatarData(n.date)}</time></p>` : ''}
      <h1 class="noticia__titulo">${esc(n.title)}</h1>
      <p class="noticia__lead">${esc(n.short)}</p>
      <div class="noticia__autor"><img src="assets/logo/logo-epasb-128.webp" width="36" height="36" alt=""><span>Por <strong>${esc(n.author || 'EPASB-EP')}</strong></span></div>
      ${slides.length ? `<figure>
        <div class="carrossel">
          <div class="carrossel__pista" tabindex="0" aria-label="Fotografias e vídeo da notícia">${slides.map((s) => `<div class="carrossel__slide">${s}</div>`).join('')}</div>
          <span class="carrossel__contador"></span>
          <button class="carrossel__seta carrossel__seta--ant" type="button" aria-label="Anterior">←</button>
          <button class="carrossel__seta carrossel__seta--seg" type="button" aria-label="Seguinte">→</button>
        </div>
        <figcaption><span>${legenda}</span><span class="carrossel__pontos" data-pontos></span></figcaption>
      </figure>` : ''}
      <div class="noticia__corpo">
        ${paragrafos.map((p) => `<p>${esc(p)}</p>`).join('')}
        ${n.source ? `<p><a href="${esc(n.source)}" target="_blank" rel="noopener noreferrer">Ver a publicação original no Facebook →</a></p>` : ''}
      </div>
    </article>`;

  const carrossel = main.querySelector('.carrossel');
  if (carrossel) {
    iniciarCarrossel(carrossel);
    iniciarFacades(carrossel);
    iniciarLightbox(fotos, [...carrossel.querySelectorAll('[data-foto]')]);
  }
}
