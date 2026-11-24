// Dados públicos do site (notícias, avisos, consulta de pedidos), lidos directamente da API do Supabase.
// Não usa a biblioteca supabase-js, para as páginas públicas ficarem leves.
//
// Notícias: vêm da tabela "noticias" do Supabase. Se a tabela ainda não existir ou estiver vazia,
// usa as notícias de public/data/noticias.json, para o site nunca ficar sem conteúdo.
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { pub } from './util.js';

const BUCKET = 'noticias';
const cabecalhos = (token) => ({ apikey: SUPABASE_KEY, Authorization: `Bearer ${token || SUPABASE_KEY}` });

async function lerJson(url, opcoes) {
  try {
    const r = await fetch(url, opcoes);
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

// ---------- Notícias ----------
let cache = null;

export function listNews() {
  if (!cache) {
    cache = (async () => {
      const [remotas, locais, estaticas] = await Promise.all([
        lerJson(`${SUPABASE_URL}/rest/v1/noticias?select=*&order=date.desc.nullslast,created_at.desc`, { headers: cabecalhos() }),
        lerJson(pub('data/noticias.json')),
        lerJson(pub('data/paginas-noticias.json')) // criado na compilação: notícias com página própria para partilha
      ]);
      const lista = remotas?.length ? remotas : locais || [];
      const comPagina = new Set(estaticas || []);
      return lista
        .map((n) => ({ ...n, pagina: comPagina.has(String(n.id)) }))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    })();
  }
  return cache;
}

export async function getNews(id) {
  return (await listNews()).find((n) => String(n.id) === String(id)) || null;
}

// Endereço de uma notícia: a página própria (boa para partilhar) ou a página genérica.
export const enderecoNoticia = (n) =>
  n.pagina ? pub(`noticia-${encodeURIComponent(n.id)}`) : pub(`noticia?id=${encodeURIComponent(n.id)}`);

// ---------- Avisos (faixa no topo) ----------
export async function listAvisos() {
  return (await lerJson(`${SUPABASE_URL}/rest/v1/avisos?select=id,texto,tipo,link&order=created_at.desc`, { headers: cabecalhos() })) || [];
}

// ---------- Consulta de pedidos de atendimento ----------
// Devolve { codigo, assunto, status, resposta, criado, atualizado } ou null se não existir.
export async function consultarPedido(codigo) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/consultar_pedido`, {
    method: 'POST',
    headers: { ...cabecalhos(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_codigo: codigo })
  });
  if (!r.ok) throw new Error(`consulta ${r.status}`);
  const linhas = await r.json();
  return linhas[0] || null;
}

// ---------- Publicação e edição de notícias (painel administrativo) ----------

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

const PUBLICO = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
const publico = (caminho) => PUBLICO + caminho;

// Caminhos no Storage dos ficheiros de uma notícia (para os apagar). Fotografias do próprio site são ignoradas.
export function ficheirosNoStorage(urls) {
  return urls.filter((u) => u?.startsWith(PUBLICO)).flatMap((u) => {
    const caminho = u.slice(PUBLICO.length);
    return /-1600\.jpg$/.test(caminho) ? [caminho, caminho.replace(/-1600\.jpg$/, '-800.jpg')] : [caminho];
  });
}

const aleatorio = () => Math.random().toString(36).slice(2, 8);

// Cria (sem id) ou actualiza (com id) uma notícia.
// dados: { id?, estado? ('publicado' | 'revisao' | 'rascunho'), title, author, short, body,
//          fotos: [{ url } (já publicada) | { ficheiro: File } (nova)],
//          video: null | {type:'youtube', id} | {type:'file', ficheiro: File} | {type:'file', src, poster} (já publicado) }
// Devolve { id, removidas } — removidas = ficheiros antigos que deixaram de ser usados (o painel apaga-os).
export async function guardarNoticia(dados, onProgress, token, anterior = null) {
  const id = dados.id || crypto.randomUUID();
  const envios = [];

  // 1. Preparar as fotografias novas (1600px e 800px).
  const photos = [];
  for (const f of dados.fotos) {
    if (!f.ficheiro) { photos.push(f.url); continue; }
    const nome = `${id}/${aleatorio()}`;
    envios.push({ caminho: `${nome}-1600.jpg`, blob: await reduzir(f.ficheiro, 1600), tipo: 'image/jpeg' });
    envios.push({ caminho: `${nome}-800.jpg`, blob: await reduzir(f.ficheiro, 800), tipo: 'image/jpeg' });
    photos.push(publico(`${nome}-1600.jpg`));
  }
  let video = null;
  if (dados.video?.type === 'youtube') video = { type: 'youtube', id: dados.video.id, poster: `https://i.ytimg.com/vi/${dados.video.id}/hqdefault.jpg` };
  if (dados.video?.type === 'file' && dados.video.ficheiro) {
    const caminho = `${id}/video-${aleatorio()}.mp4`;
    envios.push({ caminho, blob: dados.video.ficheiro, tipo: 'video/mp4' });
    video = { type: 'file', src: publico(caminho), poster: photos[0] };
  }
  if (dados.video?.type === 'file' && !dados.video.ficheiro) video = { ...dados.video, poster: photos[0] };

  // 2. Enviar, um ficheiro de cada vez (mais seguro em ligações fracas).
  const total = envios.reduce((s, e) => s + e.blob.size, 0) || 1;
  let feito = 0;
  for (const e of envios) {
    await carregar(e.caminho, e.blob, e.tipo, token, (parcial) => onProgress(Math.min(99, Math.round(((feito + parcial) / total) * 100))));
    feito += e.blob.size;
  }

  // 3. Criar ou actualizar o registo.
  const registo = { title: dados.title, author: dados.author, short: dados.short, body: dados.body, photos, video, ...(dados.estado && { estado: dados.estado }) };
  const url = dados.id ? `${SUPABASE_URL}/rest/v1/noticias?id=eq.${encodeURIComponent(id)}` : `${SUPABASE_URL}/rest/v1/noticias`;
  const r = await fetch(url, {
    method: dados.id ? 'PATCH' : 'POST',
    headers: { ...cabecalhos(token), 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(dados.id ? { ...registo, updated_at: new Date().toISOString() } : { id, ...registo })
  });
  if (!r.ok) throw new Error(`Notícia ${r.status}: ${await r.text()}`);

  cache = null;
  onProgress(100);
  const antigos = anterior ? [...(anterior.photos || []), anterior.video?.type === 'file' ? anterior.video.src : null] : [];
  const actuais = new Set([...photos, video?.src]);
  return { id, removidas: ficheirosNoStorage(antigos.filter((u) => u && !actuais.has(u))) };
}

// Histórico público de um pedido (mudanças de estado e respostas; nunca notas internas nem nomes da equipa).
export async function consultarHistorico(codigo) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/consultar_pedido_historico`, {
    method: 'POST', headers: { ...cabecalhos(), 'Content-Type': 'application/json' }, body: JSON.stringify({ p_codigo: codigo })
  });
  return r.ok ? r.json() : [];
}
