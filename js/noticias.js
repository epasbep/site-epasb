// Página "Notícias": grelha de cartões e botão que repete a animação da torneira.
import { listNews } from './api.js';
import { cartaoNoticia } from './util.js';

const lista = document.getElementById('lista');
const noticias = await listNews();
lista.innerHTML = noticias.length
  ? noticias.map(cartaoNoticia).join('')
  : '<p class="vazio">Ainda não há notícias publicadas.</p>';

// Substituir o SVG por uma cópia reinicia as animações CSS.
document.getElementById('repetir').addEventListener('click', () => {
  const svg = document.querySelector('#torneira svg');
  svg.replaceWith(svg.cloneNode(true));
});
