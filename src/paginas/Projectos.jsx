// Página "Projectos" (inspirada na página de projectos da EPAL): projectos em curso e concluídos,
// com filtro, fotografias e ligação às notícias de cada projecto.
// Os projectos estão em public/data/projectos.json.
import { useEffect, useRef, useState } from 'react';
import { listNews, enderecoNoticia } from '../api.js';
import { fonteFoto, pub } from '../util.js';
import { Carrossel } from '../componentes/Carrossel.jsx';

const ESTADOS = { 'em-curso': ['Em curso', 'estado--curso'], concluido: ['Concluído', 'estado--concluido'] };

function Detalhe({ projecto: p, noticias, fechar }) {
  const botao = useRef(null);
  useEffect(() => {
    const anterior = document.activeElement;
    botao.current?.focus();
    const tecla = (e) => { if (e.key === 'Escape') fechar(); };
    document.addEventListener('keydown', tecla);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', tecla); document.body.style.overflow = ''; anterior?.focus?.(); };
  }, []);
  const relacionadas = noticias.filter((n) => p.noticias?.includes(String(n.id)));
  const [estado, classe] = ESTADOS[p.estado] || ESTADOS['em-curso'];
  return (
    <div className="modal" onClick={(e) => { if (e.target === e.currentTarget) fechar(); }}>
      <div className="detalhe-projecto" role="dialog" aria-modal="true" aria-labelledby="dp-titulo">
        <div className="modal__topo">
          <span className={`estado ${classe}`}>{estado}</span>
          <button className="modal__fechar" type="button" aria-label="Fechar" ref={botao} onClick={fechar}>×</button>
        </div>
        <h2 className="h2" id="dp-titulo" style={{ margin: 0 }}>{p.titulo}</h2>
        <p className="projecto__local">{p.local}</p>
        <Carrossel fotos={p.fotos || []} />
        <div className="noticia__corpo">
          {p.descricao.split(/\n\s*\n/).map((t, i) => <p key={i}>{t}</p>)}
        </div>
        {relacionadas.length > 0 && (
          <div>
            <h3 className="h3" style={{ marginBottom: 10 }}>Notícias sobre este projecto</h3>
            <ul className="ligacoes">{relacionadas.map((n) => <li key={n.id}><a href={enderecoNoticia(n)}>{n.title} →</a></li>)}</ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Projectos() {
  const [projectos, setProjectos] = useState(null);
  const [noticias, setNoticias] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [aberto, setAberto] = useState(null);

  useEffect(() => {
    fetch(pub('data/projectos.json')).then((r) => r.json()).then(setProjectos).catch(() => setProjectos([]));
    listNews().then(setNoticias);
  }, []);

  const conta = (e) => (projectos || []).filter((p) => p.estado === e).length;
  const filtros = [['todos', 'Todos', projectos?.length || 0], ['em-curso', 'Em curso', conta('em-curso')], ['concluido', 'Concluídos', conta('concluido')]]
    .filter(([id, , n]) => id === 'todos' || n > 0);
  const visiveis = (projectos || []).filter((p) => filtro === 'todos' || p.estado === filtro);

  return (
    <main id="conteudo">
      <section className="hero hero--simples">
        <div className="container hero__dentro">
          <div className="hero__texto">
            <p className="eyebrow">Projectos e investimentos</p>
            <h1 className="h1">Obras e programas que levam água a mais pessoas</h1>
            <p className="lead" style={{ marginBottom: 0 }}>Conheça os projectos da EPASB-EP para melhorar o abastecimento de água e o saneamento na província de Benguela.</p>
          </div>
        </div>
      </section>

      <section className="container seccao" aria-labelledby="t-projectos">
        <h2 className="sr" id="t-projectos">Lista de projectos</h2>
        {filtros.length > 1 && (
          <div className="filtros" role="group" aria-label="Filtrar projectos">
            {filtros.map(([id, nome, n]) => (
              <button key={id} type="button" aria-pressed={filtro === id} onClick={() => setFiltro(id)}>{nome} ({n})</button>
            ))}
          </div>
        )}
        <div className="grelha" aria-live="polite">
          {projectos === null && <p className="vazio">A carregar projectos…</p>}
          {projectos?.length === 0 && <p className="vazio">Ainda não há projectos publicados.</p>}
          {visiveis.map((p) => {
            const [estado, classe] = ESTADOS[p.estado] || ESTADOS['em-curso'];
            return (
              <article className="projecto" key={p.id}>
                <div className="projecto__media">
                  {p.fotos?.[0] && <img {...fonteFoto(p.fotos[0], '(min-width: 700px) 380px, 100vw')} alt="" loading="lazy" decoding="async" />}
                  <span className={`estado projecto__estado ${classe}`}>{estado}</span>
                </div>
                <div className="projecto__corpo">
                  <span className="projecto__local">{p.local}</span>
                  <h3>{p.titulo}</h3>
                  <p>{p.resumo}</p>
                  <button className="btn btn--secundario" type="button" onClick={() => setAberto(p)}>Ver projecto</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      {aberto && <Detalhe projecto={aberto} noticias={noticias} fechar={() => setAberto(null)} />}
    </main>
  );
}
