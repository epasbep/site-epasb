// Página "Serviços": informação prática para o cidadão.
// Só contém factos já publicados pela EPASB-EP (notícias, contactos). Horários, moradas e documentos
// para ligações ainda têm de ser fornecidos pela EPASB-EP (horários e moradas: src/dados/agencias.js).
import { TELEFONE } from '../config.js';
import { ZONAS } from '../dados/agencias.js';

export default function Servicos() {
  return (
    <main id="conteudo">
      <section className="hero hero--simples">
        <div className="container hero__dentro">
          <div className="hero__texto">
            <p className="eyebrow">Serviços ao cidadão</p>
            <h1 className="h1">Como podemos ajudar</h1>
            <p className="lead" style={{ marginBottom: 0 }}>Pedidos, avarias, contadores pré-pagos e os pontos de atendimento da EPASB-EP em toda a província.</p>
          </div>
        </div>
      </section>

      <section className="container seccao" aria-labelledby="t-faq">
        <div className="seccao__topo"><p className="eyebrow">Perguntas frequentes</p><h2 className="h2" id="t-faq">O que precisa de saber</h2></div>
        <div className="faq">
          <details>
            <summary>Como peço uma nova ligação de água?</summary>
            <p>Faça o pedido através do <a href="contacto">formulário de atendimento</a>, escolhendo o assunto «Solicitação», ou dirija-se ao ponto de atendimento mais próximo. No fim do envio recebe um número para acompanhar o seu pedido.</p>
          </details>
          <details>
            <summary>Há uma fuga, uma ligação ilegal ou falta de água no meu bairro. O que faço?</summary>
            <p>Ligue para o <a href={`tel:${TELEFONE.ligar}`}>{TELEFONE.visivel}</a>, escreva pelo <a href={`https://wa.me/${TELEFONE.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp</a> ou use o <a href="contacto">formulário de atendimento</a> com o assunto «Denúncia».</p>
          </details>
          <details>
            <summary>O que são os contadores pré-pagos?</summary>
            <p>São contadores que modernizam a medição e a gestão do consumo de água e dão mais autonomia aos clientes.</p>
            <p>O programa começou no Município do Lobito, com a fase-piloto na Restinga, e será estendido aos municípios de Benguela, Catumbela, Navegantes e Baía Farta ao longo de sete meses. Saiba mais na página de <a href="projectos">Projectos</a>.</p>
          </details>
          <details>
            <summary>O que é a Cobrança Móvel?</summary>
            <p>É uma das novas soluções apresentadas pela EPASB-EP aos moradores para tornar o acesso aos serviços mais simples e próximo. Para saber se já está disponível no seu bairro, contacte o Atendimento.</p>
          </details>
          <details>
            <summary>Já fiz um pedido. Como sei em que estado está?</summary>
            <p>Use o número que recebeu no fim do envio na caixa <a href="contacto#consultar">Consultar pedido</a>, na página de Atendimento. Aí vê o estado e a resposta da EPASB-EP.</p>
          </details>
        </div>
      </section>

      <section className="seccao seccao--branca" aria-labelledby="t-agencias">
        <div className="container">
          <div className="seccao__topo seccao__topo--linha">
            <div><p className="eyebrow">Onde estamos</p><h2 className="h2" id="t-agencias">Pontos de atendimento por zona</h2></div>
            <a className="btn btn--secundario" href="./#t-mapa">Ver no mapa</a>
          </div>
          <div className="agencias">
            {ZONAS.map((z) => (
              <div className="caixa" key={z.nome}>
                <h3 className="h3"><span className="mapa__ponto" style={{ background: z.cor }} />{z.nome}</h3>
                {z.morada && <p>{z.morada}</p>}
                {z.horario && <p><strong>Horário:</strong> {z.horario}</p>}
                <ul>{z.pontos.map((p) => <li key={p}>{p}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
