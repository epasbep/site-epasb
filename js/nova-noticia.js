// Painel administrativo: formulário "Publicar notícia".
import { sb, obterSessao, ligarTopo } from './admin-sessao.js';
import { publishNews } from './api.js';
import { esc, formatarData } from './util.js';
import { LIMITES, ytId, adicionarFotos, tornarCapa, validar, validarVideo, guardarRascunho, lerRascunho, apagarRascunho } from './publicar.js';

const sessao = await obterSessao();
if (!sessao) location.replace('index.html');
else iniciar();

function iniciar() {
  document.getElementById('painel').hidden = false;
  ligarTopo(sessao);

  const $ = (id) => document.getElementById(id);
  const form = $('form-noticia');
  const campos = { titulo: $('f-titulo'), autor: $('f-autor'), breve: $('f-breve'), descricao: $('f-descricao') };
  const estado = { fotos: [], videoModo: 'nenhum', videoLink: '', videoFicheiro: null };

  // ---------- Erros ----------
  const erro = (campo, texto) => {
    const p = form.querySelector(`[data-erro="${campo}"]`);
    p.textContent = texto || '';
    p.closest('.campo').classList.toggle('campo--erro', !!texto);
  };

  // ---------- Pré-visualização e contadores ----------
  const hoje = new Date().toLocaleDateString('sv'); // AAAA-MM-DD na hora local
  function actualizarPrevia() {
    $('n-titulo').textContent = `${campos.titulo.value.length}/${LIMITES.titulo}`;
    $('n-breve').textContent = `${campos.breve.value.length}/${LIMITES.breve}`;
    $('p-meta').textContent = `${formatarData(hoje)} · ${campos.autor.value.trim() || 'Autor'}`;
    $('p-titulo').textContent = campos.titulo.value.trim() || 'Título da notícia';
    $('p-breve').textContent = campos.breve.value.trim() || 'A breve descrição aparece aqui.';
    $('p-capa').innerHTML = estado.fotos[0] ? `<img src="${estado.fotos[0].url}" alt="">` : 'Sem fotografia de capa';
  }

  const dadosRascunho = () => ({
    titulo: campos.titulo.value, autor: campos.autor.value, breve: campos.breve.value, descricao: campos.descricao.value,
    videoModo: estado.videoModo === 'link' ? 'link' : 'nenhum', videoLink: estado.videoLink
  });

  Object.entries(campos).forEach(([nome, el]) => el.addEventListener('input', () => {
    erro(nome, '');
    actualizarPrevia();
    guardarRascunho(dadosRascunho());
  }));

  // ---------- Fotografias ----------
  const grelha = $('fotos');
  function desenharFotos() {
    const n = estado.fotos.length;
    $('n-fotos').textContent = `${n} / ${LIMITES.fotos}`;
    grelha.innerHTML = estado.fotos.map((f, i) => `<div class="foto">
        <img src="${f.url}" alt="Fotografia ${i + 1}">
        ${i === 0 ? '<span class="foto__capa">Capa</span>' : `<button class="foto__tornar" type="button" data-capa="${i}">Tornar capa</button>`}
        <button class="foto__remover" type="button" data-remover="${i}" aria-label="Remover fotografia ${i + 1}">×</button>
      </div>`).join('') + (n < LIMITES.fotos ? `<label class="foto-adicionar">
        <b>+</b><span>Adicionar</span><small>faltam ${LIMITES.fotos - n}</small>
        <input class="sr" type="file" multiple accept="image/jpeg,image/png" aria-label="Adicionar fotografias">
      </label>` : '');
    actualizarPrevia();
  }
  function juntar(ficheiros) {
    const antes = estado.fotos.length;
    const r = adicionarFotos(estado.fotos, ficheiros);
    estado.fotos = r.fotos;
    $('aviso-fotos').textContent = r.aviso;
    if (estado.fotos.length > antes) erro('fotos', '');
    desenharFotos();
  }
  grelha.addEventListener('change', (e) => { if (e.target.type === 'file') juntar(e.target.files); });
  grelha.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.capa) estado.fotos = tornarCapa(estado.fotos, Number(b.dataset.capa));
    if (b.dataset.remover) {
      const [fora] = estado.fotos.splice(Number(b.dataset.remover), 1);
      URL.revokeObjectURL(fora.url);
      $('aviso-fotos').textContent = '';
    }
    desenharFotos();
  });
  grelha.addEventListener('dragover', (e) => { e.preventDefault(); grelha.classList.add('arrastar'); });
  grelha.addEventListener('dragleave', () => grelha.classList.remove('arrastar'));
  grelha.addEventListener('drop', (e) => { e.preventDefault(); grelha.classList.remove('arrastar'); juntar(e.dataTransfer.files); });

  // ---------- Vídeo ----------
  const segmentos = $('video-modo');
  function desenharVideo() {
    segmentos.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modo === estado.videoModo)));
    $('video-link').hidden = estado.videoModo !== 'link';
    $('video-ficheiro').hidden = estado.videoModo !== 'ficheiro';
    const id = estado.videoModo === 'link' ? ytId(estado.videoLink) : null;
    $('yt-ok').hidden = !id;
    if (id) $('yt-mini').src = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
    $('mp4-ok').hidden = !estado.videoFicheiro;
    $('mp4-nome').textContent = estado.videoFicheiro?.name || '';
  }
  segmentos.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    estado.videoModo = b.dataset.modo;
    erro('video', '');
    desenharVideo();
    guardarRascunho(dadosRascunho());
  });
  $('f-yt').addEventListener('input', (e) => { estado.videoLink = e.target.value; erro('video', ''); desenharVideo(); guardarRascunho(dadosRascunho()); });
  $('f-mp4').addEventListener('change', (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    const problema = validarVideo(f);
    erro('video', problema);
    if (!problema) estado.videoFicheiro = f;
    desenharVideo();
  });
  $('mp4-remover').addEventListener('click', () => { estado.videoFicheiro = null; desenharVideo(); });

  // ---------- Limpar ----------
  function limpar(manterAutor) {
    const autor = campos.autor.value;
    form.reset();
    if (manterAutor) campos.autor.value = autor;
    estado.fotos.forEach((f) => URL.revokeObjectURL(f.url));
    Object.assign(estado, { fotos: [], videoModo: 'nenhum', videoLink: '', videoFicheiro: null });
    ['titulo', 'autor', 'breve', 'descricao', 'fotos', 'video'].forEach((c) => erro(c, ''));
    $('aviso-fotos').textContent = '';
    apagarRascunho();
    desenharFotos();
    desenharVideo();
  }
  $('limpar').addEventListener('click', () => { if (confirm('Limpar todo o formulário?')) limpar(false); });

  // ---------- Modal de envio (torneira a encher o tanque) ----------
  const modal = $('modal');
  const TORNEIRA = `<g fill="#004B70" transform="translate(4,0)"><rect x="0" y="30" width="14" height="44" rx="3"/><rect x="10" y="42" width="72" height="20" rx="4"/>
    <path d="M78 42 H88 A18 18 0 0 1 106 60 V82 H86 V66 A4 4 0 0 0 82 62 H78 Z"/><rect x="84" y="80" width="24" height="5" rx="2"/><rect x="38" y="28" width="8" height="16"/>
    <rect x="22" y="20" width="40" height="9" rx="4.5" fill="#009FE3"/></g>`;
  const TEXTOS = {
    enviar: ['A publicar…', () => `A carregar ${estado.fotos.length === 1 ? '1 fotografia' : estado.fotos.length + ' fotografias'}. Não feche esta página.`],
    sucesso: ['Notícia publicada', () => 'Já está visível na página de Notícias do site.'],
    erro: ['Não foi possível publicar', () => 'A ligação falhou. O rascunho foi guardado — tente novamente.']
  };
  let fase = null;

  function nivel(p) {
    const altura = 58 * p / 100, topo = 160 - altura;
    const agua = modal.querySelector('#t-agua');
    if (!agua) return;
    agua.setAttribute('y', topo); agua.setAttribute('height', altura + 2);
    modal.querySelector('#t-cima').setAttribute('y', topo);
    modal.querySelector('#t-jacto')?.setAttribute('height', Math.max(0, topo - 85));
    modal.querySelector('#t-fluxo')?.setAttribute('y2', topo);
    $('barra').style.width = p + '%';
  }

  function mostrarModal(novaFase, progresso = 0, detalhe = '') {
    fase = novaFase;
    const [titulo, texto] = TEXTOS[fase];
    $('arte').innerHTML = `<svg class="tanque" viewBox="0 0 200 170" aria-hidden="true">
      <defs><clipPath id="epTank"><rect x="52" y="102" width="96" height="58" rx="10"/></clipPath></defs>
      <rect x="50" y="100" width="100" height="62" rx="12" fill="#F5F7F6" stroke="#C9D7DA" stroke-width="2"/>
      <g clip-path="url(#epTank)"><rect id="t-agua" x="52" width="96" fill="${fase === 'erro' ? '#9FD8EC' : '#009FE3'}"/><rect id="t-cima" x="52" width="96" height="3" fill="#39C6F4"/></g>
      ${TORNEIRA}
      ${fase === 'enviar' ? '<rect id="t-jacto" x="96" y="85" width="8" fill="#39C6F4"/><line id="t-fluxo" class="fluxo" x1="100" y1="86" x2="100" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-dasharray="3 9"/>' : ''}
      ${fase === 'erro' ? '<path class="gota" transform="translate(4,0)" d="M96 86 C96 86 90 94 90 98 A6 6 0 0 0 102 98 C102 94 96 86 96 86Z" fill="#39C6F4"/>' : ''}
      ${fase === 'sucesso' ? '<path d="M84 131 l11 11 l22 -22" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' : ''}
    </svg>`;
    $('m-titulo').textContent = titulo;
    $('m-texto').textContent = texto();
    $('m-detalhe').textContent = detalhe;
    $('m-progresso').hidden = fase !== 'enviar';
    $('m-sucesso').hidden = fase !== 'sucesso';
    $('m-erro').hidden = fase !== 'erro';
    modal.hidden = false;
    nivel(fase === 'sucesso' ? 100 : progresso);
    (fase === 'sucesso' ? $('ver') : fase === 'erro' ? $('repetir') : $('m-titulo')).focus?.();
  }

  // ---------- Publicar ----------
  let ultimoProgresso = 0;
  async function publicar() {
    const dados = { ...Object.fromEntries(Object.entries(campos).map(([k, el]) => [k, el.value])), ...estado };
    const erros = validar(dados);
    ['titulo', 'autor', 'breve', 'descricao', 'fotos', 'video'].forEach((c) => erro(c, erros[c]));
    const primeiro = Object.keys(erros)[0];
    if (primeiro) {
      (campos[primeiro] || form.querySelector(`[data-erro="${primeiro}"]`).closest('.campo')).scrollIntoView({ block: 'center' });
      campos[primeiro]?.focus();
      modal.hidden = true;
      return;
    }

    guardarRascunho(dadosRascunho());
    ultimoProgresso = 0;
    mostrarModal('enviar');
    try {
      const actual = await obterSessao();
      if (!actual) throw new Error('A sessão expirou. Entre de novo no painel.');
      let video = null;
      if (estado.videoModo === 'link') video = { type: 'youtube', id: ytId(estado.videoLink) };
      if (estado.videoModo === 'ficheiro') video = { type: 'file', ficheiro: estado.videoFicheiro };
      const id = await publishNews({
        title: dados.titulo.trim(), author: dados.autor.trim(), short: dados.breve.trim(), body: dados.descricao.trim(),
        fotos: estado.fotos.map((f) => f.ficheiro), video
      }, (p) => { ultimoProgresso = p; nivel(p); }, actual.access_token);
      apagarRascunho();
      $('ver').href = `../noticia.html?id=${encodeURIComponent(id)}`;
      mostrarModal('sucesso');
    } catch (e) {
      console.error('Publicar notícia:', e);
      mostrarModal('erro', ultimoProgresso, `Detalhe técnico: ${e.message}`);
    }
  }
  form.addEventListener('submit', (ev) => { ev.preventDefault(); publicar(); });
  $('repetir').addEventListener('click', publicar);
  $('voltar').addEventListener('click', () => { modal.hidden = true; });
  $('outra').addEventListener('click', () => { modal.hidden = true; limpar(true); campos.titulo.focus(); });

  // Avisar antes de sair a meio de um envio.
  window.addEventListener('beforeunload', (e) => { if (!modal.hidden && fase === 'enviar') e.preventDefault(); });

  // ---------- Arranque: repor rascunho ----------
  const r = lerRascunho();
  if (r) {
    campos.titulo.value = r.titulo || ''; campos.autor.value = r.autor || '';
    campos.breve.value = r.breve || ''; campos.descricao.value = r.descricao || '';
    estado.videoModo = r.videoModo === 'link' ? 'link' : 'nenhum';
    estado.videoLink = r.videoLink || '';
    $('f-yt').value = estado.videoLink;
    if (r.titulo || r.descricao) $('aviso-rascunho').hidden = false;
  }
  desenharFotos();
  desenharVideo();
}
