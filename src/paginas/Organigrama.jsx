// Página "Organigrama": órgãos da empresa (segundo o Estatuto Orgânico) e Conselho de Administração.
import { pub } from '../util.js';

const PCA = ['pca-tanislau', 'Tanislau João Soares', 'Presidente do Conselho de Administração (PCA)'];
const ADMINISTRADORES = [
  ['adm-cesar', 'António César', 'Administrador Executivo para Técnica'],
  ['adm-januario', 'Januário Cuteta', 'Administrador Executivo para Área de Estudo e Projectos'],
  ['adm-adalgisa', 'Adalgisa Ramiro', 'Administradora Executiva para Área Financeira'],
  ['adm-filomena', 'Filomena dos Santos', 'Administradora Executiva para Comercial']
];

function Pessoa({ dados: [foto, nome, cargo], destaque }) {
  return (
    <article className={`pessoa${destaque ? ' pessoa--pca' : ''}`}>
      <img src={pub(`assets/img/equipa/${foto}.webp`)} width="640" height="640" alt="" loading="lazy" decoding="async" />
      <div><h3>{nome}</h3><p>{cargo}</p></div>
    </article>
  );
}

export default function Organigrama() {
  return (
    <main id="conteudo">
      <section className="hero hero--simples">
        <div className="container hero__dentro">
          <div className="hero__texto">
            <p className="eyebrow">Organigrama institucional</p>
            <h1 className="h1">Como se organiza a EPASB-EP</h1>
            <p className="lead" style={{ marginBottom: 0 }}>Estrutura organizacional da Empresa Provincial de Águas e Saneamento de Benguela - EP, de acordo com o seu Estatuto Orgânico.</p>
          </div>
        </div>
      </section>

      <section className="container seccao" aria-labelledby="t-orgaos">
        <div className="seccao__topo"><p className="eyebrow">Estrutura</p><h2 className="h2" id="t-orgaos">Órgãos da empresa</h2></div>
        <div className="orgaos">
          <div className="orgao orgao--tutela">
            <h3>Superintendência e tutela</h3>
            <p>Titular do Poder Executivo e Ministérios responsáveis, com intervenção dos órgãos da Administração Local do Estado.</p>
          </div>
          <div className="orgaos__linha" />
          <div className="orgaos__ramos">
            <div className="orgao"><h3>Conselho de Administração</h3><p><a href="#conselho">5 membros</a></p></div>
            <div className="orgao"><h3>Conselho Fiscal</h3></div>
            <div className="orgao"><h3>Conselho Técnico Operacional</h3></div>
          </div>
        </div>
        <p className="texto" style={{ marginTop: 20, textAlign: 'center' }}>
          Competências, composição e funcionamento de cada órgão: Capítulo II do <a href="estatutos">Estatuto Orgânico</a>.
        </p>
      </section>

      <section className="seccao seccao--branca" id="conselho" aria-labelledby="t-ca">
        <div className="container">
          <div className="seccao__topo"><h2 className="h2" id="t-ca">Conselho de Administração</h2></div>
          <Pessoa dados={PCA} destaque />
          <div className="equipa">
            {ADMINISTRADORES.map((a) => <Pessoa key={a[0]} dados={a} />)}
          </div>
        </div>
      </section>
    </main>
  );
}
