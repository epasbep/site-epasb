// Animações da água: o percurso da água no topo das Notícias e o tanque do envio de notícias.
import { useEffect, useState } from 'react';
import { movimentoReduzido } from '../util.js';

export const REPETIR_MS = 6000; // os efeitos de água recomeçam a cada 6 segundos

// Devolve um número que muda a cada 6 s; usado como "key" para reiniciar as animações CSS.
export function useRepeticao(ms = REPETIR_MS) {
  const [volta, setVolta] = useState(0);
  useEffect(() => {
    if (movimentoReduzido()) return;
    const t = setInterval(() => { if (!document.hidden) setVolta((v) => v + 1); }, ms);
    return () => clearInterval(t);
  }, [ms]);
  return volta;
}

function CorpoTorneira() {
  return (
    <>
      <g fill="#004B70">
        <rect x="0" y="30" width="14" height="44" rx="3" />
        <rect x="10" y="42" width="72" height="20" rx="4" />
        <path d="M78 42 H88 A18 18 0 0 1 106 60 V82 H86 V66 A4 4 0 0 0 82 62 H78 Z" />
        <rect x="84" y="80" width="24" height="5" rx="2" />
        <rect x="38" y="28" width="8" height="16" />
      </g>
      <rect x="22" y="20" width="40" height="9" rx="4.5" fill="#009FE3" />
    </>
  );
}

const GOTA = 'M96 86 C96 86 90 94 90 98 A6 6 0 0 0 102 98 C102 94 96 86 96 86Z';
// Percurso da água em seis etapas: Captação → Tratamento → Reservação → Distribuição (torneira)
// → Saneamento, com o Controlo da qualidade ligado a todas. Recomeça sozinho a cada 6 segundos.
const ETAPAS = [
  // [x, y, nome, desenho, atraso em segundos]
  [36, 70, 'Captação', <path d="M-9 -3 q4.5 -5 9 0 t9 0 M-9 4 q4.5 -5 9 0 t9 0" fill="none" stroke="#009FE3" strokeWidth="2.2" strokeLinecap="round" />, 0],
  [130, 70, 'Tratamento', <path d="M-9 -7 H9 L2 1 V8 L-2 6 V1 Z" fill="#009FE3" />, 0.55],
  [224, 70, 'Reservação', <g><rect x="-9" y="-8" width="18" height="16" rx="3" fill="none" stroke="#004B70" strokeWidth="2" /><rect x="-7" y="0" width="14" height="6" rx="1.5" fill="#009FE3" /></g>, 0.95]
];
const SANEAMENTO = [36, 210];
const QUALIDADE = [210, 140];
const TUBO_CIMA = 'M36 70 H290';
const TUBO_BAIXO = 'M382 104 V186 Q382 210 358 210 H36';

function No({ x, y, atraso, children }) {
  return (
    <g className="surge" style={{ '--atraso': `${atraso}s` }} transform={`translate(${x} ${y})`}>
      <circle r="20" fill="#fff" stroke="#004B70" strokeWidth="2.5" />
      {children}
    </g>
  );
}

function Etiqueta({ x, y, atraso, ancora = 'middle', cor = '#004B70', children }) {
  return <text className="surge" style={{ '--atraso': `${atraso}s` }} x={x} y={y} fontSize="13" fill={cor} textAnchor={ancora}>{children}</text>;
}

export function Torneira() {
  const volta = useRepeticao();
  return (
    <svg key={volta} className="percurso" viewBox="0 0 420 262" role="img"
      aria-label="Percurso da água: captação, tratamento, reservação, distribuição na torneira e saneamento, com controlo da qualidade em todas as etapas">
      <defs>
        <linearGradient id="epG" x1="36" y1="0" x2="382" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#39C6F4" /><stop offset=".45" stopColor="#009FE3" />
          <stop offset=".8" stopColor="#40ADC8" /><stop offset="1" stopColor="#004B70" />
        </linearGradient>
      </defs>

      {/* Tubagens */}
      <path d={TUBO_CIMA} stroke="#C9D7DA" strokeWidth="18" strokeLinecap="round" fill="none" />
      <path d={TUBO_CIMA} stroke="#EEF3F4" strokeWidth="13" strokeLinecap="round" fill="none" />
      <path d="M36 210 H358 Q382 210 382 186 V174" stroke="#C9D7DA" strokeWidth="18" strokeLinecap="round" fill="none" />
      <path d="M36 210 H358 Q382 210 382 186 V174" stroke="#EEF3F4" strokeWidth="13" strokeLinecap="round" fill="none" />
      <path d="M368 166 H396 L389 177 H375 Z" fill="#C9D7DA" />

      {/* Controlo da qualidade: ligações a todas as etapas */}
      <g fill="none" stroke="#40ADC8" strokeWidth="1.6">
        {[[130, 88], [224, 88], [52, 198], [370, 140]].map(([x, y]) => (
          <line key={x} className="controlo" style={{ '--atraso': '3.5s' }} x1={QUALIDADE[0]} y1={QUALIDADE[1]} x2={x} y2={y} />
        ))}
      </g>

      {/* Água */}
      <path className="agua-tubo" style={{ '--atraso': '.2s', '--dur': '1.2s' }} d={TUBO_CIMA} fill="none" stroke="url(#epG)" strokeWidth="7" pathLength="1" />
      <path className="agua-fluxo" style={{ '--atraso': '1.4s' }} d={TUBO_CIMA} fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" pathLength="100" strokeDasharray="3 9" />
      <path className="gota" style={{ '--atraso': '1.45s' }} d="M382 105 C382 105 376 113 376 117 A6 6 0 0 0 388 117 C388 113 382 105 382 105Z" fill="#39C6F4" />
      <path className="agua-tubo" style={{ '--atraso': '1.9s', '--dur': '1.4s' }} d={TUBO_BAIXO} fill="none" stroke="#40ADC8" strokeWidth="7" pathLength="1" />
      <path className="agua-fluxo" style={{ '--atraso': '3.3s' }} d={TUBO_BAIXO} fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" pathLength="100" strokeDasharray="3 9" />

      {/* Torneira = Distribuição */}
      <g transform="translate(286 18)"><CorpoTorneira /></g>

      {/* Etapas */}
      {ETAPAS.map(([x, y, nome, desenho, atraso]) => (
        <g key={nome}>
          <No x={x} y={y} atraso={atraso}>{desenho}</No>
          <Etiqueta x={x} y={y + 37} atraso={atraso}>{nome}</Etiqueta>
        </g>
      ))}
      <Etiqueta x={328} y={30} atraso={1.4}>Distribuição</Etiqueta>
      <No x={SANEAMENTO[0]} y={SANEAMENTO[1]} atraso={3.2}>
        <path d="M-7 -2 A7.5 7.5 0 0 1 6 -5 l-0.5 -4.5 M6 -5 l-4.4 0.8 M7 2 A7.5 7.5 0 0 1 -6 5 l0.5 4.5 M-6 5 l4.4 -0.8" fill="none" stroke="#004B70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </No>
      <Etiqueta x={14} y={250} atraso={3.2} ancora="start">Saneamento</Etiqueta>
      <No x={QUALIDADE[0]} y={QUALIDADE[1]} atraso={3.5}>
        <path d="M-3 -9 H3 M-2 -9 V-3 L-8 6 A2.4 2.4 0 0 0 -6 10 H6 A2.4 2.4 0 0 0 8 6 L2 -3 V-9 M-5 3 H5" fill="none" stroke="#004B70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </No>
      <Etiqueta x={QUALIDADE[0]} y={QUALIDADE[1] + 38} atraso={3.5} cor="#00699A">Controlo da qualidade</Etiqueta>
    </svg>
  );
}

// Torneira a encher um tanque com a percentagem real do envio. fase: 'enviar' | 'sucesso' | 'erro'
export function Tanque({ fase, progresso }) {
  const p = fase === 'sucesso' ? 100 : progresso;
  const altura = (58 * p) / 100, topo = 160 - altura;
  return (
    <svg className="tanque" viewBox="0 0 200 170" aria-hidden="true">
      <defs><clipPath id="epTank"><rect x="52" y="102" width="96" height="58" rx="10" /></clipPath></defs>
      <rect x="50" y="100" width="100" height="62" rx="12" fill="#F5F7F6" stroke="#C9D7DA" strokeWidth="2" />
      <g clipPath="url(#epTank)">
        <rect x="52" y={topo} width="96" height={altura + 2} fill={fase === 'erro' ? '#9FD8EC' : '#009FE3'} />
        <rect x="52" y={topo} width="96" height="3" fill="#39C6F4" />
      </g>
      <g transform="translate(4,0)"><CorpoTorneira /></g>
      {fase === 'enviar' && (
        <>
          <rect x="96" y="85" width="8" height={Math.max(0, topo - 85)} fill="#39C6F4" />
          <line className="fluxo" x1="100" y1="86" x2="100" y2={topo} stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeDasharray="3 9" />
        </>
      )}
      {fase === 'erro' && <path className="gota" transform="translate(4,0)" d={GOTA} fill="#39C6F4" />}
      {fase === 'sucesso' && <path d="M84 131 l11 11 l22 -22" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}
