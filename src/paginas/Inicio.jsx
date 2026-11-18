// Página inicial.
import { useEffect, useRef, useState } from 'react';
import { GrelhaNoticias } from '../componentes/CartaoNoticia.jsx';
import { Particulas } from '../componentes/Particulas.jsx';
import { ZONAS } from '../dados/agencias.js';
import { movimentoReduzido, pub } from '../util.js';

// Corre "fn" uma vez, quando o elemento se aproxima do ecrã.
function useQuandoVisivel(fn, margem = '0px') {
  const ref = useRef(null);
  useEffect(() => {
    const o = new IntersectionObserver((e) => { if (e[0].isIntersecting) { o.disconnect(); fn(); } }, { rootMargin: margem });
    o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return ref;
}

// ---------- O que fazemos (cada caixa enche-se de água, de 6 em 6 segundos) ----------
const SERVICOS = [
  ['Abastecimento de Água', 'Distribuição segura e contínua de água potável para as comunidades da província.',
    ['M12 2.69s6 7.03 6 11.15a6 6 0 0 1-12 0c0-4.12 6-11.15 6-11.15z']],
  ['Saneamento', 'Gestão responsável de águas residuais e protecção ambiental dos recursos hídricos.',
    ['M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5', 'M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12', 'm14 16-3 3 3 3', 'M8.293 13.596 7.196 9.5 3.1 10.598', 'm9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843', 'm13.378 9.633 4.096 1.098 1.097-4.096']],
  ['Qualidade da Água', 'Controlo laboratorial contínuo da qualidade da água captada e distribuída.',
    ['M6 18h8', 'M3 22h18', 'M14 22a7 7 0 1 0 0-14h-1', 'M9 14h2', 'M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z', 'M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3']]
];

function Servicos() {
  return (
    <div className="grelha">
      {SERVICOS.map(([titulo, texto, tracos], i) => (
        <div className="caixa caixa--agua" key={titulo} style={{ '--atraso': `${i * 0.35}s` }}>
          <Agua />
          <span className="caixa__icone">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {tracos.map((d) => <path key={d} d={d} />)}
            </svg>
          </span>
          <h3 className="h3">{titulo}</h3>
          <p>{texto}</p>
        </div>
      ))}
    </div>
  );
}

// Água a subir com duas ondas a correr (as do rodapé da página "Novo site em breve").
function Agua() {
  return (
    <span className="agua" aria-hidden="true">
      <span className="agua__nivel">
        <svg className="agua__onda agua__onda--tras" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path fill="#7FD0FF" d="M0 60C120 20 240 20 360 60S600 100 720 60s240-40 360 0 240 40 360 0V120H0Z" />
        </svg>
        <svg className="agua__onda" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path fill="#C6EBFC" d="M0 70C120 40 240 40 360 70S600 100 720 70s240-30 360 0 240 30 360 0V120H0Z" />
        </svg>
        <span className="agua__corpo" />
      </span>
    </span>
  );
}

// ---------- Números ----------
const milhares = (n) => String(n).replace(/\B(?=(\d{3})+$)/g, ' ');

function Numero({ valor, legenda }) {
  const [mostrado, setMostrado] = useState(valor);
  const ref = useQuandoVisivel(() => {
    if (movimentoReduzido()) return;
    const inicio = performance.now();
    const passo = (agora) => {
      const p = Math.min((agora - inicio) / 1200, 1);
      setMostrado(Math.round(valor * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  });
  return <div className="numero" ref={ref}><strong>{milhares(mostrado)}</strong><span>{legenda}</span></div>;
}

// ---------- Mapa das agências (zonas em src/dados/agencias.js) ----------

function Mapa() {
  const [aberta, setAberta] = useState(null);
  const [estado, setEstado] = useState('espera'); // espera | pronto | erro
  const leaflet = useRef(null); // { mapa, marcadores }

  // A biblioteca do mapa (Leaflet) só é descarregada quando a secção se aproxima do ecrã.
  const tela = useQuandoVisivel(async () => {
    try {
      const [{ default: L }] = await Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')]);
      const mapa = L.map(tela.current, { scrollWheelZoom: false }).setView([-12.75, 14.0], 8);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' }).addTo(mapa);
      const marcadores = ZONAS.map((z) => {
        const popup = document.createElement('div');
        popup.innerHTML = '<strong></strong><ul></ul>';
        popup.querySelector('strong').textContent = z.nome;
        z.pontos.forEach((p) => { popup.querySelector('ul').appendChild(document.createElement('li')).textContent = p; });
        const icone = L.divIcon({
          className: '', iconSize: [22, 22], iconAnchor: [11, 22], popupAnchor: [0, -20],
          html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:${z.cor};transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`
        });
        return L.marker(z.coords, { icon: icone, title: z.nome }).addTo(mapa).bindPopup(popup);
      });
      leaflet.current = { mapa, marcadores };
      setEstado('pronto');
    } catch {
      setEstado('erro');
    }
  }, '300px');

  const escolher = (i) => {
    const nova = aberta === i ? null : i;
    setAberta(nova);
    if (nova !== null && leaflet.current) {
      leaflet.current.mapa.flyTo(ZONAS[i].coords, 12, { duration: movimentoReduzido() ? 0 : 0.8 });
      leaflet.current.marcadores[i].openPopup();
    }
  };

  return (
    <div className="mapa">
      {/* A lista funciona sozinha, mesmo que o mapa não carregue. */}
      <div className="mapa__lista">
        {ZONAS.map((z, i) => (
          <div key={z.nome}>
            <button className="mapa__zona" type="button" aria-pressed={aberta === i} aria-expanded={aberta === i} onClick={() => escolher(i)}>
              <span className="mapa__ponto" style={{ background: z.cor }} /><span>{z.nome}</span><span className="mapa__conta">{z.pontos.length}</span>
            </button>
            {aberta === i && <ul className="mapa__detalhe">{z.pontos.map((p) => <li key={p}>{p}</li>)}</ul>}
          </div>
        ))}
      </div>
      <div className="mapa__tela">
        {estado === 'espera' && 'A carregar o mapa…'}
        {estado === 'erro' && 'Não foi possível carregar o mapa. Consulte a lista de zonas.'}
        {/* O Leaflet desenha dentro deste elemento; o React não lhe toca. */}
        <div className="mapa__leaflet" ref={tela} role="application" aria-label="Mapa da rede de agências da EPASB" />
      </div>
    </div>
  );
}

export default function Inicio() {
  return (
    <main id="conteudo">
      <section className="hero hero--particulas">
        <Particulas />
        <div className="container hero__dentro">
          <div className="hero__texto">
            <p className="eyebrow">Província de Benguela · Angola</p>
            <h1 className="h1">Unidos pela água. Comprometidos com o futuro.</h1>
            <p className="lead">Garantimos abastecimento de água de qualidade, sustentabilidade e proximidade com os cidadãos de toda a província de Benguela.</p>
            <div className="botoes">
              <a className="btn btn--primario" href="contacto.html">Atendimento ao cidadão</a>
              <a className="btn btn--secundario" href="sobre.html">Conhecer a EPASB</a>
            </div>
          </div>
          <div className="hero__arte">
            <img className="hero__foto" src={pub('assets/img/hero-water-800.webp')}
              srcSet={`${pub('assets/img/hero-water-800.webp')} 800w, ${pub('assets/img/hero-water-1600.webp')} 1600w`}
              sizes="(min-width: 820px) 520px, 100vw" width="800" height="450" alt="" fetchPriority="high" />
          </div>
        </div>
      </section>

      <section className="container seccao" aria-labelledby="t-servicos">
        <div className="seccao__topo">
          <p className="eyebrow">O que fazemos</p>
          <h2 className="h2" id="t-servicos">Três frentes de serviço público</h2>
        </div>
        <Servicos />
      </section>

      <section className="seccao seccao--branca" aria-labelledby="t-numeros">
        <div className="container">
          <div className="seccao__topo">
            <p className="eyebrow">EPASB em números</p>
            <h2 className="h2" id="t-numeros">Cobertura e impacto</h2>
          </div>
          <div className="numeros">
            <Numero valor={11} legenda="Municípios atendidos" />
            <Numero valor={238400} legenda="Cidadãos beneficiados" />
          </div>
        </div>
      </section>

      <section className="container seccao" aria-labelledby="t-noticias">
        <div className="seccao__topo seccao__topo--linha">
          <div><p className="eyebrow">Notícias e comunicados</p><h2 className="h2" id="t-noticias">Últimas notícias</h2></div>
          <a className="btn btn--secundario" href="noticias.html">Ver todas as notícias</a>
        </div>
        <GrelhaNoticias limite={3} />
      </section>

      <section className="seccao seccao--branca" aria-labelledby="t-mapa">
        <div className="container">
          <div className="seccao__topo">
            <p className="eyebrow">Onde estamos</p>
            <h2 className="h2" id="t-mapa">Agências e pontos de atendimento</h2>
            <p className="lead">Escolha uma zona para ver os pontos de atendimento.</p>
          </div>
          <Mapa />
        </div>
      </section>
    </main>
  );
}
