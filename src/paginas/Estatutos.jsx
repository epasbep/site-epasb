// Página "Estatutos".
import { pub } from '../util.js';

const CAPITULOS = [
  ['Capítulo I · Art. 1.º a 5.º', 'Disposições Gerais', 'Denominação e natureza, regime jurídico, âmbito, sede e representações, objecto estatutário e capital estatutário da empresa.'],
  ['Capítulo II · Art. 6.º a 25.º', 'Organização e Funcionamento', 'Órgãos da empresa — Conselho de Administração, Conselho Fiscal e Conselho Técnico Operacional — respectivas competências, composição, mandatos e funcionamento.'],
  ['Capítulo III · Art. 26.º a 28.º', 'Intervenção do Poder Executivo', 'Superintendência e tutela exercidas pelo Titular do Poder Executivo e pelos Ministérios responsáveis, e intervenção dos órgãos da Administração Local do Estado.'],
  ['Capítulo IV · Art. 29.º a 39.º', 'Gestão Patrimonial e Financeira', 'Património e seguros da empresa, princípios e condições de gestão financeira, instrumentos de gestão, relatórios de contas, receitas e afectação de lucros.'],
  ['Capítulo V · Art. 40.º a 43.º', 'Pessoal', 'Regime jurídico e política salarial dos trabalhadores, formação profissional e participação dos trabalhadores na gestão da empresa.'],
  ['Capítulo VI · Art. 44.º a 47.º', 'Protecção do Ambiente, Saúde Pública e Responsabilidade Social', 'Plano de gestão de resíduos, vigilância sanitária, educação ambiental e sanitária e responsabilidade social empresarial.'],
  ['Capítulo VII · Art. 48.º e 49.º', 'Planos Operacionais e de Controlo da Qualidade da Água', 'Planos operacionais e planos de controlo e monitorização da qualidade da água fornecida à população.'],
  ['Capítulo VIII · Art. 50.º a 57.º', 'Disposições Finais', 'Convocatórias, responsabilidade perante terceiros, conservação de arquivos, auditoria interna, contratação de especialistas, direito de participação e serviços mínimos em caso de greve.']
];

export default function Estatutos() {
  return (
    <main id="conteudo">
      <section className="hero hero--simples">
        <div className="container hero__dentro">
          <div className="hero__texto">
            <p className="eyebrow">Documento oficial · Decreto Executivo Conjunto n.º 171/22</p>
            <h1 className="h1">Estatuto Orgânico da EPASB</h1>
            <p className="lead">Natureza jurídica, objecto social, órgãos sociais, regime patrimonial e financeiro, regime do pessoal e demais disposições, publicados no Diário da República, I Série, n.º 53, de 25 de Março de 2022.</p>
            <div className="botoes">
              <a className="btn btn--primario" href={pub('assets/docs/estatutos-epasb.pdf')} download>Descarregar PDF</a>
              <a className="btn btn--secundario" href="#capitulos">Ver capítulos</a>
            </div>
          </div>
        </div>
      </section>
      <section className="container seccao">
        <h2 className="sr">O estatuto em números</h2>
        <div className="numeros">
          <div className="numero"><strong>8</strong><span>Capítulos</span></div>
          <div className="numero"><strong>57</strong><span>Artigos</span></div>
          <div className="numero"><strong>171/22</strong><span>Decreto Executivo Conjunto</span></div>
        </div>
      </section>
      <section className="seccao seccao--branca" id="capitulos" aria-labelledby="t-caps">
        <div className="container">
          <div className="seccao__topo"><h2 className="h2" id="t-caps">Capítulos do Estatuto Orgânico</h2></div>
          <ol className="capitulos">
            {CAPITULOS.map(([artigos, titulo, resumo]) => <li key={titulo}><small>{artigos}</small><h3>{titulo}</h3><p>{resumo}</p></li>)}
          </ol>
        </div>
      </section>
    </main>
  );
}
