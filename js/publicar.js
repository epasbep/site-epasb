// Regras do formulário "Publicar notícia": limites, validação e rascunho local.
export const LIMITES = { titulo: 120, breve: 200, fotos: 10, fotoMB: 5, videoMB: 50 };

export const ytId = (u) => {
  const m = (u || '').match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
};

// Junta novas fotos às existentes respeitando o limite de 10. Devolve { fotos, aviso }.
export function adicionarFotos(actuais, ficheiros) {
  const lista = [...ficheiros];
  const imgs = lista.filter((f) => /image\/(jpeg|png)/.test(f.type));
  const ok = imgs.filter((f) => f.size <= LIMITES.fotoMB * 1024 * 1024);
  const espaco = LIMITES.fotos - actuais.length;
  const novas = ok.slice(0, espaco);
  const excesso = ok.length - novas.length;
  let aviso = '';
  if (excesso) aviso = `Limite de 10 fotografias — ${excesso} ${excesso > 1 ? 'não foram adicionadas' : 'não foi adicionada'}.`;
  else if (imgs.length < lista.length) aviso = 'Só são aceites ficheiros JPG ou PNG.';
  else if (ok.length < imgs.length) aviso = 'Algumas fotografias passam de 5 MB e não foram adicionadas.';
  return { fotos: [...actuais, ...novas.map((f) => ({ ficheiro: f, url: URL.createObjectURL(f) }))], aviso };
}

// A primeira foto é a capa.
export const tornarCapa = (fotos, i) => [fotos[i], ...fotos.filter((_, k) => k !== i)];

export function validar({ titulo, autor, breve, descricao, fotos, videoModo, videoLink, videoFicheiro }) {
  const e = {};
  if (!titulo.trim()) e.titulo = 'Escreva o título.';
  if (!autor.trim()) e.autor = 'Indique o autor.';
  if (!breve.trim()) e.breve = 'Escreva uma breve descrição.';
  if (!descricao.trim()) e.descricao = 'Escreva a descrição da notícia.';
  if (!fotos.length) e.fotos = 'Adicione pelo menos uma fotografia.';
  if (videoModo === 'link' && !ytId(videoLink)) e.video = 'Cole um link válido do YouTube (ex.: https://youtu.be/…).';
  if (videoModo === 'ficheiro' && !videoFicheiro) e.video = 'Escolha um ficheiro de vídeo MP4.';
  return e;
}

export function validarVideo(f) {
  if (!/video\/mp4/.test(f.type)) return 'Só são aceites vídeos MP4.';
  if (f.size > LIMITES.videoMB * 1024 * 1024) return 'O vídeo passa de 50 MB. Prefira publicar no YouTube e colar o link.';
  return '';
}

// Rascunho local (texto e link do vídeo), para não perder dados se a ligação falhar.
// As fotografias não cabem no armazenamento do browser e têm de ser escolhidas de novo.
const CHAVE = 'epasb-rascunho-noticia';
export const guardarRascunho = (dados) => { try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch {} };
export const lerRascunho = () => { try { return JSON.parse(localStorage.getItem(CHAVE)); } catch { return null; } };
export const apagarRascunho = () => { try { localStorage.removeItem(CHAVE); } catch {} };
