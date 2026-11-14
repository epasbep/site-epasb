// Funções pequenas partilhadas pelas páginas.

// Caminho até à raiz do site (as páginas do painel estão dentro de /admin).
export const RAIZ = location.pathname.includes('/admin/') ? '../' : '';

// Endereço de um ficheiro da pasta "public" (imagens, dados, PDF…).
export const pub = (caminho) => (/^(https?:|blob:|data:)/.test(caminho) ? caminho : RAIZ + caminho);

export const movimentoReduzido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// "2026-08-26" → "26 Ago 2026"
export function formatarData(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${Number(m[3])} ${MESES[Number(m[2]) - 1]} ${m[1]}` : '';
}

export const contarFotos = (n) => (n === 1 ? '1 fotografia' : `${n} fotografias`);

// Versão pequena (800px) de uma fotografia que segue a convenção "-1600." no nome.
export const miniatura = (url) => url.replace(/-1600\.(webp|jpg)$/, '-800.$1');

// Atributos de <img> para uma fotografia (usa a versão de 800px quando existe).
export function fonteFoto(url, sizes) {
  const grande = pub(url), pequena = miniatura(grande);
  return pequena === grande ? { src: grande } : { src: pequena, srcSet: `${pequena} 800w, ${grande} 1600w`, sizes };
}
