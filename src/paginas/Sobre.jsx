// Página "Sobre".
import { pub } from '../util.js';

const DIRECTRIZES = [
  ['Missão', 'Prestar serviços de abastecimento de água e saneamento com qualidade, eficiência e responsabilidade, contribuindo para a saúde, o bem-estar e o desenvolvimento sustentável das comunidades de Benguela.'],
  ['Visão', 'Ser uma referência na gestão dos serviços de água e saneamento, reconhecida pela qualidade, eficiência, inovação, sustentabilidade e compromisso com os cidadãos.'],
  ['Valores', 'Responsabilidade, integridade, transparência, eficiência, sustentabilidade, inovação, respeito pelas pessoas e compromisso com a qualidade.']
];
const ETAPAS = [
  ['Captação', 'Recolha da água a partir das fontes disponíveis e destinadas ao abastecimento público.'],
  ['Tratamento', 'Processos destinados a garantir que a água cumpra os requisitos necessários para o abastecimento e consumo.'],
  ['Reservação', 'Armazenamento e gestão da água tratada para apoiar a regularidade do abastecimento.'],
  ['Distribuição', 'Transporte da água através da rede de distribuição até aos pontos de consumo.'],
  ['Saneamento', 'Actividades relacionadas com a gestão adequada das águas residuais e a protecção do ambiente.'],
  ['Controlo da qualidade', 'Acompanhamento dos processos e parâmetros relacionados com a qualidade da água.']
];
const OPERACAO = [
  ['Operação', 'Acompanhamento das infra-estruturas e dos sistemas necessários para manter o serviço de abastecimento e saneamento em funcionamento.'],
  ['Manutenção', 'Intervenção preventiva e correctiva sobre equipamentos e redes, procurando reduzir falhas e melhorar a disponibilidade do serviço.'],
  ['Qualidade', 'Monitorização dos processos associados à água e atenção permanente às condições de qualidade do serviço prestado.'],
  ['Atendimento', 'Comunicação com os cidadãos para receber pedidos, reclamações, sugestões e ocorrências relacionadas com os serviços.']
];

export default function Sobre() {
  return (
    <main id="conteudo">
      <section className="hero hero--simples">
        <div className="container hero__dentro">
          <div className="hero__texto">
            <p className="eyebrow">Sobre a EPASB-EP</p>
            <h1 className="h1">Água e saneamento como serviço público essencial</h1>
            <p className="lead">Uma empresa pública orientada para o abastecimento de água e o saneamento, com foco na qualidade do serviço, sustentabilidade e proximidade com as comunidades da província de Benguela.</p>
            <div className="botoes">
              <a className="btn btn--primario" href="organigrama.html">Ver organigrama</a>
              <a className="btn btn--secundario" href="estatutos.html">Ler os estatutos</a>
            </div>
          </div>
        </div>
      </section>

      <section className="container seccao" aria-labelledby="t-quem">
        <div className="duas">
          <div>
            <p className="eyebrow">Quem somos</p>
            <h2 className="h2" id="t-quem">Ao serviço das comunidades de Benguela</h2>
            <p className="texto">A Empresa Provincial de Águas e Saneamento de Benguela - EP, EPASB-EP, tem como foco a prestação de serviços relacionados com o abastecimento de água e o saneamento na província de Benguela.</p>
            <p className="texto">A sua actuação está ligada à gestão e operação da infra-estrutura necessária para garantir que a água seja captada, tratada, armazenada e distribuída de forma adequada às populações, bem como à gestão das actividades relacionadas com o saneamento.</p>
            <p className="texto">A EPASB-EP procura desenvolver uma actuação orientada para a eficiência operacional, a qualidade dos serviços, a sustentabilidade dos recursos hídricos e uma relação cada vez mais próxima com os cidadãos.</p>
          </div>
          <img src={pub('assets/img/about-water-800.webp')} width="800" height="1067" alt="" loading="lazy" decoding="async" />
        </div>
      </section>

      <section className="seccao seccao--branca" aria-labelledby="t-dir">
        <div className="container">
          <div className="seccao__topo"><p className="eyebrow">Princípios institucionais</p><h2 className="h2" id="t-dir">Directrizes estratégicas</h2></div>
          <div className="grelha">
            {DIRECTRIZES.map(([t, p], i) => (
              <div className="caixa" key={t}><span className="caixa__num">0{i + 1}</span><h3 className="h3">{t}</h3><p>{p}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="container seccao" aria-labelledby="t-origem">
        <div className="seccao__topo">
          <p className="eyebrow">Infra-estrutura</p>
          <h2 className="h2" id="t-origem">Da origem da água ao cidadão</h2>
          <p className="lead">O serviço de abastecimento depende de uma cadeia de infra-estrutura e operações que trabalham em conjunto para levar água às comunidades.</p>
        </div>
        <ol className="etapas">
          {ETAPAS.map(([t, p]) => <li key={t}><h3>{t}</h3><p>{p}</p></li>)}
        </ol>
      </section>

      <section className="seccao seccao--branca" aria-labelledby="t-comp">
        <div className="container duas">
          <div>
            <p className="eyebrow">Compromisso</p>
            <h2 className="h2" id="t-comp">Uma infra-estrutura que existe para servir pessoas</h2>
            <p className="texto">O trabalho da EPASB-EP não termina na infra-estrutura. O objectivo final é garantir um serviço que tenha impacto real na vida das famílias, das instituições e das actividades económicas da província.</p>
            <p className="texto">Por isso, eficiência operacional, protecção dos recursos hídricos, melhoria contínua e proximidade com o cidadão fazem parte de uma mesma responsabilidade: prestar um serviço público cada vez mais confiável.</p>
          </div>
          <div className="caixa">
            <span className="caixa__num">IDENTIDADE</span>
            <h3 className="h3">Corrente de Benguela</h3>
            <p>A água e o saneamento são essenciais para a saúde, a qualidade de vida, o desenvolvimento económico e o bem-estar das comunidades.</p>
            <p>A identidade da EPASB-EP representa esse compromisso: garantir serviços essenciais com eficiência, responsabilidade e respeito pelo ambiente.</p>
          </div>
        </div>
      </section>

      <section className="container seccao" aria-labelledby="t-como">
        <div className="seccao__topo"><p className="eyebrow">Como trabalhamos</p><h2 className="h2" id="t-como">Uma operação orientada para a continuidade</h2></div>
        <div className="grelha grelha--2">
          {OPERACAO.map(([t, p]) => <div className="caixa" key={t}><h3 className="h3">{t}</h3><p>{p}</p></div>)}
        </div>
      </section>
    </main>
  );
}
