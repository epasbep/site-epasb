// Página "Organigrama".
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
            <h1 className="h1">Quem dirige a EPASB-EP</h1>
            <p className="lead">Estrutura organizacional da Empresa Provincial de Água e Saneamento de Benguela, EPASB-EP.</p>
          </div>
        </div>
      </section>
      <section className="container seccao" aria-labelledby="t-ca">
        <div className="seccao__topo"><h2 className="h2" id="t-ca">Conselho de Administração</h2></div>
        <Pessoa dados={PCA} destaque />
        <div className="equipa">
          {ADMINISTRADORES.map((a) => <Pessoa key={a[0]} dados={a} />)}
        </div>
      </section>
    </main>
  );
}
