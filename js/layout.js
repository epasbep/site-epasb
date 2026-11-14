// Cabeçalho, faixa "Disque e Denúncia!" e rodapé — escritos UMA vez aqui e
// inseridos em todas as páginas públicas. Para mudar o menu, basta editar PAGINAS.
import { TELEFONE, EMAILS, MORADA, REDES, GOOGLE_ANALYTICS } from './config.js';

const PAGINAS = [
  ['inicio', 'Início', 'index.html'],
  ['sobre', 'Sobre', 'sobre.html'],
  ['organigrama', 'Organigrama', 'organigrama.html'],
  ['estatutos', 'Estatutos', 'estatutos.html'],
  ['noticias', 'Notícias', 'noticias.html'],
  ['contacto', 'Contacto', 'contacto.html']
];

const actual = document.body.dataset.pagina;
const links = PAGINAS.map(([id, nome, url]) => `<a href="${url}"${id === actual ? ' aria-current="page"' : ''}>${nome}</a>`).join('');

document.body.insertAdjacentHTML('afterbegin', `
<a class="saltar" href="#conteudo">Saltar para o conteúdo</a>
<header class="cabecalho">
  <div class="container cabecalho__dentro">
    <a class="marca" href="index.html">
      <img src="assets/logo/logo-epasb-128.webp" width="44" height="44" alt="">
      <span class="marca__texto"><strong>EPASB-EP</strong><span>Água e Saneamento de Benguela</span></span>
    </a>
    <nav class="nav" aria-label="Navegação principal">${links}</nav>
    <a class="btn btn--primario btn--atendimento" href="contacto.html">Atendimento</a>
    <button class="hamburguer" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav-movel"><span></span><span></span><span></span></button>
  </div>
  <nav class="nav-movel" id="nav-movel" aria-label="Navegação principal (telemóvel)">
    ${links}
    <a class="btn btn--primario" href="contacto.html">Atendimento ao cidadão</a>
  </nav>
</header>`);

document.body.insertAdjacentHTML('beforeend', `
<section class="faixa" aria-labelledby="faixa-titulo">
  <div class="container faixa__dentro">
    <div class="faixa__texto">
      <h2 id="faixa-titulo">Disque e Denúncia!</h2>
      <p>Fugas, ligações ilegais ou falta de água no seu bairro? Fale connosco.</p>
    </div>
    <div class="botoes">
      <a class="btn btn--branco" href="tel:${TELEFONE.ligar}">Ligar agora</a>
      <a class="btn btn--contorno" href="https://wa.me/${TELEFONE.whatsapp}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
    </div>
  </div>
</section>
<footer class="rodape">
  <div class="container rodape__dentro">
    <div class="rodape__col rodape__col--marca">
      <img src="assets/logo/logo-epasb-branco.webp" width="280" height="51" alt="EPASB-EP" loading="lazy">
      <p>Empresa Provincial de Água e Saneamento de Benguela. Abastecimento de água potável e saneamento básico na província de Benguela, Angola.</p>
    </div>
    <div class="rodape__col">
      <strong>Páginas</strong>
      ${PAGINAS.map(([, nome, url]) => `<a href="${url}">${nome}</a>`).join('')}
    </div>
    <div class="rodape__col">
      <strong>Institucional</strong>
      <a href="https://minea.gov.ao/" target="_blank" rel="noopener noreferrer">Ministério da Energia e Águas</a>
      <a href="https://governo.gov.ao/" target="_blank" rel="noopener noreferrer">Governo de Angola</a>
      <a href="https://benguela.gov.ao/" target="_blank" rel="noopener noreferrer">Governo Provincial de Benguela</a>
      <a href="https://epal.co.ao/" target="_blank" rel="noopener noreferrer">EPAL</a>
    </div>
    <div class="rodape__col">
      <strong>Contacto</strong>
      <span>${MORADA}</span>
      <a href="tel:${TELEFONE.ligar}">${TELEFONE.visivel}</a>
      ${EMAILS.map((e) => `<a href="mailto:${e}">${e}</a>`).join('')}
      <a href="${REDES.facebook}" target="_blank" rel="noopener noreferrer">Facebook</a>
      <a href="${REDES.instagram}" target="_blank" rel="noopener noreferrer">Instagram</a>
      <a href="https://wa.me/${TELEFONE.whatsapp}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
    </div>
  </div>
  <div class="container rodape__fim">© ${new Date().getFullYear()} Empresa Provincial de Água e Saneamento de Benguela</div>
</footer>`);

// Menu do telemóvel
const botao = document.querySelector('.hamburguer');
const menu = document.getElementById('nav-movel');
botao.addEventListener('click', () => {
  const aberto = menu.classList.toggle('aberto');
  botao.setAttribute('aria-expanded', String(aberto));
  botao.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
});

// Google Analytics (contagem de visitas) — carregado depois da página, para não a atrasar.
if (GOOGLE_ANALYTICS && location.hostname.endsWith('epasb.ao')) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GOOGLE_ANALYTICS);
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS}`;
  document.head.appendChild(s);
}
