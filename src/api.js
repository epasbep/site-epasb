// Camada de dados das notícias. É o único ficheiro que fala com o backend (Supabase).
//   listNews()                          → todas as notícias, da mais recente para a mais antiga
//   getNews(id)                         → uma notícia
//   publishNews(dados, onProgress, token) → publica (só painel administrativo)
//
// As notícias vêm de dois sítios e são juntas numa só lista:
//   1. tabela "noticias" do Supabase (as publicadas pelo painel);
//   2. public/data/noticias.json (as notícias iniciais, que funcionam mesmo sem backend).
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { pub } from './util.js';

const SEMENTE = pub('data/noticias.json');
const BUCKET = 'noticias';
let cache = null;

const cabecalhos = (token) => ({ apikey: SUPABASE_KEY, Authorization: `Bearer ${token || SUPABASE_KEY}` });

async function lerJson(url, opcoes) {
  try {
    const r = await fetch(url, opcoes);
    return r.ok ? await r.json() : [];
  } catch {
    return [];
  }
}

export async function listNews() {
  if (cache) return cache;
  const [remotas, locais] = await Promise.all([
    lerJson(`${SUPABASE_URL}/rest/v1/noticias?select=*&order=date.desc`, { headers: cabecalhos() }),
    lerJson(SEMENTE)
  ]);
  // Notícias sem data ficam no fim.
  cache = [...remotas, ...locais].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return cache;
}

export async function getNews(id) {
  return (await listNews()).find((n) => String(n.id) === String(id)) || null;
}

// ---------- Publicação ----------

// Reduz uma fotografia para a largura indicada e devolve um JPEG leve.
async function reduzir(ficheiro, largura) {
  const img = await createImageBitmap(ficheiro);
  const escala = Math.min(1, largura / img.width);
  const tela = document.createElement('canvas');
  tela.width = Math.round(img.width * escala);
  tela.height = Math.round(img.height * escala);
  const ctx = tela.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, tela.width, tela.height);
  ctx.drawImage(img, 0, 0, tela.width, tela.height);
  img.close?.();
  return new Promise((ok, erro) => tela.toBlob((b) => (b ? ok(b) : erro(new Error('imagem'))), 'image/jpeg', 0.82));
}

// Envia um ficheiro para o Storage com progresso real.
function carregar(caminho, blob, tipo, token, aoProgredir) {
  return new Promise((ok, erro) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${caminho}`);
    Object.entries(cabecalhos(token)).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.setRequestHeader('Content-Type', tipo);
    xhr.setRequestHeader('Cache-Control', 'max-age=31536000');
    xhr.upload.onprogress = (ev) => aoProgredir(ev.loaded);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? ok() : erro(new Error(`Storage ${xhr.status}: ${xhr.responseText}`)));
    xhr.onerror = () => erro(new Error('rede'));
    xhr.send(blob);
  });
}

const publico = (caminho) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${caminho}`;

// dados: { title, author, short, body, fotos: File[], video: null | {type:'youtube', id} | {type:'file', ficheiro: File} }
export async function publishNews(dados, onProgress, token) {
  const id = crypto.randomUUID();
  const envios = [];

  // 1. Preparar: cada fotografia em 1600px e 800px.
  for (let i = 0; i < dados.fotos.length; i++) {
    for (const largura of [1600, 800]) {
      envios.push({ caminho: `${id}/${i + 1}-${largura}.jpg`, blob: await reduzir(dados.fotos[i], largura), tipo: 'image/jpeg' });
    }
  }
  if (dados.video?.type === 'file') envios.push({ caminho: `${id}/video.mp4`, blob: dados.video.ficheiro, tipo: 'video/mp4' });

  // 2. Enviar, um ficheiro de cada vez (mais seguro em ligações fracas).
  const total = envios.reduce((s, e) => s + e.blob.size, 0) || 1;
  let feito = 0;
  for (const e of envios) {
    await carregar(e.caminho, e.blob, e.tipo, token, (parcial) => onProgress(Math.min(99, Math.round(((feito + parcial) / total) * 100))));
    feito += e.blob.size;
  }

  // 3. Criar o registo da notícia.
  const photos = dados.fotos.map((_, i) => publico(`${id}/${i + 1}-1600.jpg`));
  let video = null;
  if (dados.video?.type === 'youtube') video = { type: 'youtube', id: dados.video.id, poster: `https://i.ytimg.com/vi/${dados.video.id}/hqdefault.jpg` };
  if (dados.video?.type === 'file') video = { type: 'file', src: publico(`${id}/video.mp4`), poster: photos[0] };

  const r = await fetch(`${SUPABASE_URL}/rest/v1/noticias`, {
    method: 'POST',
    headers: { ...cabecalhos(token), 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ id, title: dados.title, author: dados.author, short: dados.short, body: dados.body, photos, video })
  });
  if (!r.ok) throw new Error(`Notícia ${r.status}: ${await r.text()}`);

  cache = null;
  onProgress(100);
  return id;
}
