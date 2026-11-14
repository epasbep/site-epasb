// Funções pequenas partilhadas pelas páginas.

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// "2026-08-26" → "26 Ago 2026"
export function formatarData(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${Number(m[3])} ${MESES[Number(m[2]) - 1]} ${m[1]}` : '';
}

export const contarFotos = (n) => (n === 1 ? '1 fotografia' : `${n} fotografias`);

// Versão pequena (800px) de uma fotografia que segue a convenção "-1600." no nome.
export const miniatura = (url) => (/-1600\.(webp|jpg)$/.test(url) ? url.replace(/-1600\.(webp|jpg)$/, '-800.$1') : url);

// Atributos src/srcset para uma fotografia (usa a versão de 800px quando existe).
export function fonteFoto(url, sizes) {
  const pequena = miniatura(url);
  return pequena === url
    ? `src="${esc(url)}"`
    : `src="${esc(pequena)}" srcset="${esc(pequena)} 800w, ${esc(url)} 1600w" sizes="${sizes}"`;
}

// Cartão de notícia (lista, página inicial e pré-visualização do painel).
export function cartaoNoticia(n) {
  const fotos = n.photos || [];
  const meta = [formatarData(n.date), contarFotos(fotos.length)].filter(Boolean).join(' · ');
  return `<a class="cartao" href="noticia.html?id=${encodeURIComponent(n.id)}">
    <div class="cartao__media">
      ${fotos[0] ? `<img ${fonteFoto(fotos[0], '(min-width: 700px) 380px, 100vw')} alt="" loading="lazy" decoding="async">` : ''}
      <div class="cartao__badges">
        ${n.video ? '<span class="badge badge--video">▶ Vídeo</span>' : ''}
        ${fotos.length > 1 ? `<span class="badge">${contarFotos(fotos.length)}</span>` : ''}
      </div>
    </div>
    <div class="cartao__corpo">
      <p class="cartao__meta">${esc(meta)}</p>
      <h3 class="cartao__titulo">${esc(n.title)}</h3>
      <p class="cartao__resumo">${esc(n.short)}</p>
      <span class="cartao__mais">Ler notícia →</span>
    </div>
  </a>`;
}
