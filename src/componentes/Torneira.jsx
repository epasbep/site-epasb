// Animações da água: a torneira do topo das Notícias e o tanque do envio de notícias.
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
const CAMINHO = 'M96 85 V168 Q96 196 124 196 H392';

// Torneira → rede → saneamento. Recomeça sozinha a cada 6 segundos.
export function Torneira() {
  const volta = useRepeticao();
  return (
    <svg key={volta} className="torneira" viewBox="0 0 400 240" role="img" aria-label="Torneira a escorrer água que segue pela rede até ao saneamento">
      <defs>
        <linearGradient id="epG" x1="96" y1="0" x2="392" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#39C6F4" /><stop offset=".35" stopColor="#009FE3" />
          <stop offset=".7" stopColor="#40ADC8" /><stop offset="1" stopColor="#004B70" />
        </linearGradient>
      </defs>
      <path d="M142 196 H392" stroke="#C9D7DA" strokeWidth="28" strokeLinecap="round" fill="none" />
      <path d="M142 196 H392" stroke="#EEF3F4" strokeWidth="23" strokeLinecap="round" fill="none" />
      <rect x="232" y="180" width="8" height="32" rx="2" fill="#C9D7DA" />
      <rect x="322" y="180" width="8" height="32" rx="2" fill="#C9D7DA" />
      <CorpoTorneira />
      <path className="gota" d={GOTA} fill="#39C6F4" />
      <path className="jacto" d={CAMINHO} fill="none" stroke="url(#epG)" strokeWidth="9" pathLength="1" />
      <path className="fluxo" d={CAMINHO} fill="none" stroke="#fff" strokeOpacity=".65" strokeWidth="2.5" strokeLinecap="round" pathLength="100" strokeDasharray="3 9" />
      <text className="et-agua" x="114" y="132" fontSize="14" fill="#004B70">Água</text>
      <text className="et-dist" x="236" y="234" fontSize="12.5" fill="#3C5257" textAnchor="middle">Distribuição</text>
      <text className="et-san" x="386" y="234" fontSize="12.5" fill="#004B70" textAnchor="end">Saneamento</text>
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
