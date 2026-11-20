// Estrutura comum das páginas "Termos de Utilização" e "Política de Privacidade".
// Os textos são uma proposta: devem ser validados pelo serviço jurídico da EPASB-EP.

export const ACTUALIZADO = '20 de Novembro de 2026';

export function Documento({ eyebrow, titulo, lead, seccoes }) {
  return (
    <main id="conteudo">
      <section className="hero hero--simples">
        <div className="container hero__dentro">
          <div className="hero__texto">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="h1">{titulo}</h1>
            <p className="lead">{lead}</p>
          </div>
        </div>
      </section>
      <section className="seccao seccao--branca">
        <div className="container documento">
          <nav className="documento__indice" aria-label="Índice">
            <strong>Índice</strong>
            <ol>
              {seccoes.map(([id, t]) => <li key={id}><a href={`#${id}`}>{t}</a></li>)}
            </ol>
          </nav>
          <div className="documento__corpo">
            {seccoes.map(([id, t, corpo], i) => (
              <section key={id} id={id} aria-labelledby={`t-${id}`}>
                <h2 className="h3" id={`t-${id}`}>{i + 1}. {t}</h2>
                {corpo}
              </section>
            ))}
            <p className="documento__data">Última actualização: {ACTUALIZADO}.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
