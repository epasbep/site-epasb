// Cabeçalho, faixa de avisos, faixa "Disque e Denúncia!" e rodapé — escritos UMA vez aqui.
// Para mudar o menu, basta editar PAGINAS.
import { useEffect, useState } from 'react';
import { TELEFONE, EMAILS, MORADA, REDES, GOOGLE_ANALYTICS } from '../config.js';
import { listAvisos } from '../api.js';
import { pub } from '../util.js';

export const NOME = 'Empresa Provincial de Águas e Saneamento de Benguela - EP';

// O antigo item "Contacto" foi substituído pelo botão "Atendimento" (mesma página).
const PAGINAS = [
  ['inicio', 'Início', './'],
  ['sobre', 'Sobre', 'sobre'],
  ['organigrama', 'Organigrama', 'organigrama'],
  ['estatutos', 'Estatutos', 'estatutos'],
  ['projectos', 'Projectos', 'projectos'],
  ['noticias', 'Notícias', 'noticias'],
  ['servicos', 'Serviços', 'servicos']
];
const FORA = { target: '_blank', rel: 'noopener noreferrer' };
const WHATSAPP = `https://wa.me/${TELEFONE.whatsapp}`;

function Links({ pagina }) {
  return PAGINAS.map(([id, nome, url]) => (
    <a key={id} href={url} aria-current={id === pagina ? 'page' : undefined}>{nome}</a>
  ));
}

function Cabecalho({ pagina }) {
  const [aberto, setAberto] = useState(false);
  const atendimento = pagina === 'contacto' ? 'page' : undefined;
  return (
    <header className="cabecalho">
      <div className="container cabecalho__dentro">
        <a className="marca" href="./">
          <img src={pub('assets/logo/logo-epasb-128.webp')} width="44" height="44" alt="" />
          <span className="marca__texto"><strong>EPASB-EP</strong><span>Águas e Saneamento de Benguela</span></span>
        </a>
        <nav className="nav" aria-label="Navegação principal"><Links pagina={pagina} /></nav>
        <a className="btn btn--primario btn--atendimento" href="contacto" aria-current={atendimento}>Atendimento</a>
        <button className="hamburguer" type="button" aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={aberto} aria-controls="nav-movel" onClick={() => setAberto(!aberto)}>
          <span /><span /><span />
        </button>
      </div>
      <nav className={`nav-movel${aberto ? ' aberto' : ''}`} id="nav-movel" aria-label="Navegação principal (telemóvel)">
        <Links pagina={pagina} />
        <a className="btn btn--primario" href="contacto" aria-current={atendimento}>Atendimento ao cidadão</a>
      </nav>
    </header>
  );
}

// Faixa de avisos (interrupções, avisos urgentes), geridos no painel. Cada aviso pode ser fechado.
const CHAVE_FECHADOS = 'epasb-avisos-fechados';
const lerFechados = () => { try { return JSON.parse(localStorage.getItem(CHAVE_FECHADOS)) || []; } catch { return []; } };

function Avisos() {
  const [avisos, setAvisos] = useState([]);
  useEffect(() => {
    const fechados = lerFechados();
    listAvisos().then((lista) => setAvisos(lista.filter((a) => !fechados.includes(a.id))));
  }, []);
  const fechar = (id) => {
    setAvisos((l) => l.filter((a) => a.id !== id));
    try { localStorage.setItem(CHAVE_FECHADOS, JSON.stringify([...lerFechados(), id].slice(-50))); } catch {}
  };
  if (!avisos.length) return null;
  return (
    <div className="avisos" role="region" aria-label="Avisos">
      {avisos.map((a) => (
        <div key={a.id} className={`aviso aviso--${a.tipo === 'urgente' ? 'urgente' : 'info'}`}>
          <div className="container aviso__dentro">
            <span className="aviso__etiqueta">{a.tipo === 'urgente' ? 'Aviso urgente' : 'Aviso'}</span>
            <p>{a.texto}{a.link && <> <a href={a.link}>Saber mais</a></>}</p>
            <button type="button" className="aviso__fechar" aria-label="Fechar aviso" onClick={() => fechar(a.id)}>×</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Faixa() {
  return (
    <section className="faixa" aria-labelledby="faixa-titulo">
      <div className="container faixa__dentro">
        <div className="faixa__texto">
          <h2 id="faixa-titulo">Disque e Denúncia!</h2>
          <p>Fugas, ligações ilegais ou falta de água no seu bairro? Fale connosco.</p>
        </div>
        <div className="botoes">
          <a className="btn btn--primario" href={`tel:${TELEFONE.ligar}`}>Ligar agora</a>
          <a className="btn btn--secundario" href={WHATSAPP} {...FORA}>WhatsApp</a>
        </div>
      </div>
    </section>
  );
}

function Rodape() {
  return (
    <footer className="rodape">
      {/* As mesmas ondas do rodapé da página "Novo site em breve" */}
      <div className="rodape__ondas" aria-hidden="true">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none"><path fill="#7FD0FF" d="M0 60C120 20 240 20 360 60S600 100 720 60s240-40 360 0 240 40 360 0V120H0Z" /></svg>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none"><path fill="#1EA7F5" d="M0 70C120 40 240 40 360 70S600 100 720 70s240-30 360 0 240 30 360 0V120H0Z" /></svg>
      </div>
      <div className="rodape__corpo">
      <div className="container rodape__dentro">
        <div className="rodape__col rodape__col--marca">
          <img src={pub('assets/logo/logo-epasb-branco.webp')} width="280" height="51" alt="EPASB-EP" loading="lazy" />
          <p>{NOME}. Abastecimento de água potável e saneamento básico na província de Benguela, Angola.</p>
        </div>
        <div className="rodape__col">
          <strong>Páginas</strong>
          {PAGINAS.map(([id, nome, url]) => <a key={id} href={url}>{nome}</a>)}
          <a href="contacto">Atendimento</a>
          <a href="contacto#consultar">Consultar pedido</a>
        </div>
        <div className="rodape__col">
          <strong>Institucional</strong>
          <a href="https://minea.gov.ao/" {...FORA}>Ministério da Energia e Águas</a>
          <a href="https://governo.gov.ao/" {...FORA}>Governo de Angola</a>
          <a href="https://benguela.gov.ao/" {...FORA}>Governo Provincial de Benguela</a>
          <a href="https://epal.co.ao/" {...FORA}>EPAL</a>
        </div>
        <div className="rodape__col">
          <strong>Contacto</strong>
          <span>{MORADA}</span>
          <a href={`tel:${TELEFONE.ligar}`}>{TELEFONE.visivel}</a>
          {EMAILS.map((e) => <a key={e} href={`mailto:${e}`}>{e}</a>)}
          <a href={REDES.facebook} {...FORA}>Facebook</a>
          <a href={REDES.instagram} {...FORA}>Instagram</a>
          <a href={WHATSAPP} {...FORA}>WhatsApp</a>
        </div>
      </div>
      <div className="container rodape__fim">
        <p>© {new Date().getFullYear()} EPASB-EP · Benguela, Angola · Todos os direitos reservados.</p>
        <p className="rodape__legal">
          <a href="termos">Termos de Utilização</a> · <a href="privacidade">Política de Privacidade</a> ·{' '}
          <button type="button" className="rodape__botao" onClick={abrirPreferenciasCookies}>Preferências de cookies</button>
        </p>
        <p className="rodape__creditos">Desenvolvimento e Consultoria: GGS · Consultor Tecnológico e Web Designer: Afonso Panzo</p>
      </div>
      </div>
    </footer>
  );
}

// Consentimento de cookies. O Google Analytics só é carregado depois de o visitante aceitar.
// A escolha fica guardada no browser; o link "Preferências de cookies" no rodapé volta a perguntar.
const CHAVE_COOKIES = 'epasb-cookies';
const lerEscolha = () => { try { return localStorage.getItem(CHAVE_COOKIES); } catch { return null; } };
const ABRIR_COOKIES = 'epasb-abrir-cookies';
export const abrirPreferenciasCookies = () => window.dispatchEvent(new Event(ABRIR_COOKIES));

function carregarAnalytics() {
  if (!GOOGLE_ANALYTICS || !location.hostname.endsWith('epasb.ao') || window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GOOGLE_ANALYTICS, { anonymize_ip: true });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS}`;
  document.head.appendChild(s);
}

function apagarCookiesAnalytics() {
  // Apaga os cookies _ga* do domínio actual e do domínio principal.
  const dominio = location.hostname.replace(/^www\./, '');
  document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => n.startsWith('_ga')).forEach((n) => {
    for (const d of ['', `; domain=.${dominio}`]) document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d}`;
  });
}

function AvisoCookies() {
  const [escolha, setEscolha] = useState(lerEscolha);
  const [aberto, setAberto] = useState(!lerEscolha());
  useEffect(() => { if (escolha === 'aceite') carregarAnalytics(); }, [escolha]);
  useEffect(() => {
    const abrir = () => setAberto(true);
    window.addEventListener(ABRIR_COOKIES, abrir);
    return () => window.removeEventListener(ABRIR_COOKIES, abrir);
  }, []);
  const decidir = (valor) => {
    try { localStorage.setItem(CHAVE_COOKIES, valor); } catch {}
    if (valor === 'recusado' && escolha === 'aceite') { apagarCookiesAnalytics(); location.reload(); return; }
    setEscolha(valor);
    setAberto(false);
  };
  if (!aberto) return null;
  return (
    <div className="cookies" role="dialog" aria-labelledby="cookies-titulo" aria-describedby="cookies-texto">
      <div className="container cookies__dentro">
        <div>
          <strong id="cookies-titulo">Cookies e privacidade</strong>
          <p id="cookies-texto">
            Usamos cookies apenas para contar as visitas e melhorar o site (Google Analytics). Não usamos cookies de publicidade.
            Pode aceitar ou recusar; o site funciona da mesma forma. Saiba mais na <a href="privacidade#cookies">Política de Privacidade</a>.
          </p>
        </div>
        <div className="botoes">
          <button className="btn btn--secundario" type="button" onClick={() => decidir('recusado')}>Recusar</button>
          <button className="btn btn--primario" type="button" onClick={() => decidir('aceite')}>Aceitar</button>
        </div>
      </div>
    </div>
  );
}

export function Layout({ pagina, children }) {
  return (
    <>
      <a className="saltar" href="#conteudo">Saltar para o conteúdo</a>
      <Avisos />
      <Cabecalho pagina={pagina} />
      {children}
      <Faixa />
      <Rodape />
      <AvisoCookies />
    </>
  );
}
