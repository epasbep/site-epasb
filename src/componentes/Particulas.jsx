// Bolhas de água ligadas entre si — as mesmas partículas da página "Novo site em breve",
// adaptadas às cores do site e limitadas ao bloco onde estão (não ao ecrã inteiro).
// Poupa bateria: pára quando o bloco sai do ecrã ou o separador fica escondido,
// usa menos bolhas em ecrãs pequenos e fica parado se o sistema pedir menos movimento.
import { useEffect, useRef } from 'react';
import { movimentoReduzido } from '../util.js';

export function Particulas() {
  const tela = useRef(null);

  useEffect(() => {
    const c = tela.current;
    const x = c.getContext('2d');
    const zona = c.parentElement; // o bloco onde as partículas vivem (recebe o movimento do rato)
    const reduzido = movimentoReduzido();
    let W = 0, H = 0, P = [], visivel = true, pedido = 0;
    const rato = { x: -999, y: -999 };

    const quantas = () => Math.min(70, Math.floor((W * H) / (W < 700 ? 22000 : 15000)));
    const nova = (qualquerAltura) => {
      const s = Math.random();
      return { x: Math.random() * W, y: qualquerAltura ? Math.random() * H : H + 20, r: 2 + s * s * 9, v: 0.25 + s * 0.9, ph: Math.random() * 6.28, a: 0.25 + Math.random() * 0.45 };
    };

    function medir() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = zona.clientWidth; H = zona.clientHeight;
      c.width = W * dpr; c.height = H * dpr;
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      P = Array.from({ length: quantas() }, () => nova(true));
      if (reduzido) desenhar();
    }

    function desenhar() {
      x.clearRect(0, 0, W, H);
      for (const p of P) {
        if (!reduzido) {
          p.y -= p.v; p.ph += 0.015; p.x += Math.sin(p.ph) * 0.35;
          const dx = p.x - rato.x, dy = p.y - rato.y, d = Math.hypot(dx, dy);
          if (d < 120 && d > 0) { p.x += (dx / d) * (120 - d) * 0.03; p.y += (dy / d) * (120 - d) * 0.03; }
          if (p.y < -20) Object.assign(p, nova(false));
        }
        const g = x.createRadialGradient(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.1, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(255,255,255,${p.a + 0.3})`);
        g.addColorStop(0.6, `rgba(0,159,227,${p.a * 0.3})`);
        g.addColorStop(1, `rgba(0,105,154,${p.a * 0.6})`);
        x.fillStyle = g;
        x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.283); x.fill();
        x.strokeStyle = `rgba(0,105,154,${p.a * 0.45})`; x.lineWidth = 0.8; x.stroke();
      }
      for (let i = 0; i < P.length; i++) {
        for (let j = i + 1; j < P.length; j++) {
          const a = P[i], b = P[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 95) {
            x.strokeStyle = `rgba(0,159,227,${(1 - d / 95) * 0.25})`; x.lineWidth = 1;
            x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
          }
        }
      }
    }

    function ciclo() {
      desenhar();
      pedido = visivel && !document.hidden ? requestAnimationFrame(ciclo) : 0;
    }
    const retomar = () => { if (!reduzido && !pedido && visivel && !document.hidden) pedido = requestAnimationFrame(ciclo); };

    const observador = new IntersectionObserver(([e]) => { visivel = e.isIntersecting; retomar(); });
    const tamanho = new ResizeObserver(medir);
    const mover = (e) => { const r = c.getBoundingClientRect(); rato.x = e.clientX - r.left; rato.y = e.clientY - r.top; };
    const sair = () => { rato.x = rato.y = -999; };

    medir();
    observador.observe(zona);
    tamanho.observe(zona);
    zona.addEventListener('pointermove', mover);
    zona.addEventListener('pointerleave', sair);
    document.addEventListener('visibilitychange', retomar);
    retomar();

    return () => {
      cancelAnimationFrame(pedido);
      observador.disconnect(); tamanho.disconnect();
      zona.removeEventListener('pointermove', mover);
      zona.removeEventListener('pointerleave', sair);
      document.removeEventListener('visibilitychange', retomar);
    };
  }, []);

  return <canvas ref={tela} className="particulas" aria-hidden="true" />;
}
