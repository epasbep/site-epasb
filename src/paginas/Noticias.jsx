// Página "Notícias": a torneira animada (repete de 6 em 6 segundos) e a grelha de cartões.
import { Torneira } from '../componentes/Torneira.jsx';
import { GrelhaNoticias } from '../componentes/CartaoNoticia.jsx';

export default function Noticias() {
  return (
    <main id="conteudo">
      <section className="hero">
        <div className="container hero__dentro">
          <div className="hero__texto">
            <p className="eyebrow">Notícias e comunicados</p>
            <h1 className="h1">Da torneira à rede: o que se passa na EPASB</h1>
            <p className="lead" style={{ marginBottom: 0 }}>Cortes programados, obras, campanhas e avisos sobre o abastecimento de água e o saneamento nos 11 municípios da província.</p>
          </div>
          <div className="hero__arte"><Torneira /></div>
        </div>
      </section>
      <section className="container seccao">
        <h2 className="sr">Todas as notícias</h2>
        <GrelhaNoticias />
      </section>
    </main>
  );
}
