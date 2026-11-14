// Página inicial: contadores animados, últimas notícias e mapa das agências.
import { listNews } from './api.js';
import { cartaoNoticia, esc } from './util.js';

const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const quandoVisivel = (el, fn, margem = '0px') => {
  const o = new IntersectionObserver((e) => { if (e[0].isIntersecting) { o.disconnect(); fn(); } }, { rootMargin: margem });
  o.observe(el);
};

// ---------- Contadores ----------
const milhares = (n) => String(n).replace(/\B(?=(\d{3})+$)/g, ' ');
if (!reduzido) {
  document.querySelectorAll('[data-contar]').forEach((el) => quandoVisivel(el, () => {
    const alvo = Number(el.dataset.contar), inicio = performance.now();
    const passo = (agora) => {
      const p = Math.min((agora - inicio) / 1200, 1);
      el.textContent = milhares(Math.round(alvo * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }));
}

// ---------- Últimas notícias ----------
listNews().then((noticias) => {
  document.getElementById('ultimas').innerHTML = noticias.length
    ? noticias.slice(0, 3).map(cartaoNoticia).join('')
    : '<p class="vazio">Ainda não há notícias publicadas.</p>';
});

// ---------- Mapa das agências ----------
const ZONAS = [
  { nome: 'Baía Farta', cor: '#009FE3', coords: [-12.6742, 13.3722], pontos: ['Agência da Baía Farta'] },
  { nome: 'Benguela', cor: '#004B70', coords: [-12.5763, 13.4055], pontos: ['Zona A', 'Zona C', 'Zona D', 'Zona E', 'Zona F', 'Centro empresarial Sul'] },
  { nome: 'Catumbela', cor: '#40ADC8', coords: [-12.4333, 13.5333], pontos: ['Vila da Catumbela', 'Luongo Vimbalambi', 'Agência Alto Niva', 'Agência Acala'] },
  { nome: 'Lobito', cor: '#39C6F4', coords: [-12.3481, 13.5456], pontos: ['Agência antiga do 28', 'Agência Sede Canata', 'Agência Nova do 28', 'Agência Centralidade do Lobito', 'Agência Centralidade do Luongo', 'Agência Bela Vista', 'Agência 27 de Março', 'Agência Alto Esperança'] },
  { nome: 'Navegantes', cor: '#00699A', coords: [-12.3612, 13.5231], pontos: ['Zona B R3', 'Zona B EE6', 'Agência das Bacias de Oxidação'] },
  { nome: 'Balombo (Zona Norte)', cor: '#8A4B00', coords: [-12.3667, 14.7667], pontos: ['Balombo'] },
  { nome: 'Bocoio (Zona Norte)', cor: '#8A4B00', coords: [-12.4667, 14.4], pontos: ['Bocoio'] },
  { nome: 'Caimbambo (Zona Sul)', cor: '#B3261E', coords: [-12.9333, 13.9667], pontos: ['Caimbambo'] },
  { nome: 'Ganda (Zona Sul)', cor: '#B3261E', coords: [-13.0167, 14.6667], pontos: ['Ganda'] },
  { nome: 'Cubal (Zona Sul)', cor: '#B3261E', coords: [-13.05, 14.25], pontos: ['Cubal'] },
  { nome: 'Chongoroi (Zona Sul)', cor: '#B3261E', coords: [-12.5833, 13.9667], pontos: ['Chongoroi'] }
];

const lista = document.getElementById('zonas');
const tela = document.getElementById('mapa');
let mapa = null;
const marcadores = [];

// A lista funciona sozinha (mesmo que o mapa não carregue): cada zona abre os seus pontos.
lista.innerHTML = ZONAS.map((z, i) => `
  <button class="mapa__zona" type="button" aria-pressed="false" aria-expanded="false" data-zona="${i}">
    <span class="mapa__ponto" style="background:${z.cor}"></span><span>${esc(z.nome)}</span><span class="mapa__conta">${z.pontos.length}</span>
  </button>
  <ul class="mapa__detalhe" hidden>${z.pontos.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`).join('');

lista.addEventListener('click', (e) => {
  const botao = e.target.closest('.mapa__zona');
  if (!botao) return;
  const i = Number(botao.dataset.zona);
  const jaAberto = botao.getAttribute('aria-pressed') === 'true';
  lista.querySelectorAll('.mapa__zona').forEach((b) => {
    const activo = b === botao && !jaAberto;
    b.setAttribute('aria-pressed', String(activo));
    b.setAttribute('aria-expanded', String(activo));
    b.nextElementSibling.hidden = !activo;
  });
  if (mapa && !jaAberto) {
    mapa.flyTo(ZONAS[i].coords, 12, { duration: reduzido ? 0 : 0.8 });
    marcadores[i].openPopup();
  }
});

// O Leaflet (biblioteca do mapa) só é descarregado quando a secção se aproxima do ecrã.
const carregar = (tag, attrs) => new Promise((ok, erro) => {
  const el = Object.assign(document.createElement(tag), attrs);
  el.onload = ok; el.onerror = erro;
  document.head.appendChild(el);
});

quandoVisivel(tela, async () => {
  try {
    const cdn = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/';
    await Promise.all([carregar('link', { rel: 'stylesheet', href: cdn + 'leaflet.css' }), carregar('script', { src: cdn + 'leaflet.js' })]);
    const L = window.L;
    tela.textContent = '';
    mapa = L.map(tela, { scrollWheelZoom: false }).setView([-12.75, 14.0], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' }).addTo(mapa);
    ZONAS.forEach((z, i) => {
      const icone = L.divIcon({
        className: '', iconSize: [22, 22], iconAnchor: [11, 22], popupAnchor: [0, -20],
        html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:${z.cor};transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`
      });
      marcadores[i] = L.marker(z.coords, { icon: icone, title: z.nome }).addTo(mapa)
        .bindPopup(`<strong>${esc(z.nome)}</strong><ul>${z.pontos.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`);
    });
  } catch {
    tela.textContent = 'Não foi possível carregar o mapa. Consulte a lista de zonas.';
  }
}, '300px');
