import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';

// Cada página do site é uma entrada própria (os endereços ficam iguais: sobre.html, noticias.html…).
const PAGINAS = [
  'index', 'sobre', 'organigrama', 'estatutos', 'projectos', 'noticias', 'noticia', 'servicos', 'contacto', 'pedido', 'termos', 'privacidade',
  'admin/index', 'admin/noticias', 'admin/nova-noticia', 'admin/avisos', 'admin/utilizadores', 'admin/auditoria', 'admin/conta'
];
// Endereços sem .html: o GitHub Pages e o .htaccess do epasb.ao servem sobre.html quando se pede /sobre.
const PUBLICAS = ['', 'sobre', 'organigrama', 'estatutos', 'projectos', 'noticias', 'servicos', 'contacto', 'termos', 'privacidade'];

// Endereço onde esta compilação vai ficar (para as partilhas e o sitemap). Definido no workflow de publicação.
const SITE = (process.env.SITE_URL || 'https://www.epasb.ao/').replace(/\/?$/, '/');
const SUPABASE_URL = 'https://yctyaycgxbbwnzgrkfwq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_rg8_rF7TpfGwoqCZtQSFqQ_D4q1a_6F';

const CSP = [
  "default-src 'self'",
  "script-src 'self' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "frame-src https://www.youtube-nocookie.com",
  "connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');

// Insere em todas as páginas o que é comum no <head>: ícones, tipo de letra e política de segurança.
function cabecaComum() {
  let aConstruir = false;
  return {
    name: 'epasb-cabeca-comum',
    configResolved(c) { aConstruir = c.command === 'build'; },
    transformIndexHtml(html, ctx) {
      const raiz = ctx.path.includes('/admin/') ? '../' : './';
      const tags = [
        { tag: 'meta', attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' } },
        { tag: 'meta', attrs: { name: 'theme-color', content: '#004B70' } },
        { tag: 'link', attrs: { rel: 'icon', href: `${raiz}assets/logo/icone-gota-32.png`, sizes: '32x32', type: 'image/png' } },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', href: `${raiz}assets/logo/icone-gota-180.png` } },
        { tag: 'link', attrs: { rel: 'manifest', href: `${raiz}site.webmanifest` } },
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' } },
        { tag: 'link', attrs: { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap' } }
      ];
      // A política de segurança só entra na versão final (em desenvolvimento o Vite precisa de scripts inline).
      if (aConstruir) tags.unshift({ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP } });
      return tags.map((t) => ({ ...t, injectTo: 'head' }));
    }
  };
}

// Depois de compilar: cria uma página própria para cada notícia (noticia-<id>.html), com o título,
// o resumo e a fotografia da notícia nas etiquetas de partilha (Facebook, WhatsApp…), e o sitemap.xml.
// As notícias vêm do Supabase; se não for possível lê-las, usa public/data/noticias.json.
function paginasDeNoticias() {
  let saida = '';
  const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const absoluto = (u) => (/^https?:/.test(u) ? u : SITE + String(u).replace(/^\.?\//, ''));
  const seguro = (id) => /^[A-Za-z0-9_-]{1,80}$/.test(String(id));

  async function lerNoticias() {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/noticias?select=id,title,short,photos,date`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
      if (r.ok) { const l = await r.json(); if (l.length) return l; }
    } catch {}
    return JSON.parse(readFileSync(resolve(import.meta.dirname, 'public/data/noticias.json'), 'utf8'));
  }

  return {
    name: 'epasb-paginas-noticias',
    apply: 'build',
    configResolved(c) { saida = resolve(c.root, c.build.outDir); },
    async closeBundle() {
      const base = readFileSync(resolve(saida, 'noticia.html'), 'utf8');
      const noticias = (await lerNoticias()).filter((n) => seguro(n.id));
      for (const n of noticias) {
        const url = `${SITE}noticia-${n.id}`;
        const titulo = `${n.title} | EPASB-EP`;
        // Facebook e WhatsApp lêem melhor JPEG: as fotografias do site têm uma cópia -800.jpg para isso.
        const imagem = n.photos?.[0] ? absoluto(String(n.photos[0]).replace(/-1600\.(webp|jpg)$/, '-800.jpg')) : `${SITE}assets/img/partilha.jpg`;
        let html = base
          .replace(/<title>[^<]*<\/title>/, `<title>${esc(titulo)}</title>`)
          .replace(/(<meta name="description" content=")[^"]*/, `$1${esc(n.short)}`)
          .replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(titulo)}`)
          .replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(n.short)}`)
          .replace(/(<meta property="og:url" content=")[^"]*/, `$1${url}`)
          .replace(/(<meta property="og:type" content=")[^"]*/, '$1article')
          .replace(/(<meta property="og:image" content=")[^"]*/, `$1${esc(imagem)}`)
          .replace(/(<link rel="canonical" href=")[^"]*/, `$1${url}`)
          .replace('</head>', `<meta name="noticia-id" content="${esc(n.id)}">\n<meta name="twitter:card" content="summary_large_image">\n</head>`);
        writeFileSync(resolve(saida, `noticia-${n.id}.html`), html);
      }
      writeFileSync(resolve(saida, 'data/paginas-noticias.json'), JSON.stringify(noticias.map((n) => String(n.id))));

      // Partilha das páginas gerais com o endereço desta compilação
      const urls = [...PUBLICAS.map((p) => SITE + p), ...noticias.map((n) => `${SITE}noticia-${n.id}`)];
      writeFileSync(resolve(saida, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
      const robots = readFileSync(resolve(saida, 'robots.txt'), 'utf8').replace(/Sitemap: .*/, `Sitemap: ${SITE}sitemap.xml`);
      writeFileSync(resolve(saida, 'robots.txt'), robots);
      console.log(`  ${noticias.length} páginas de notícias criadas para ${SITE}`);
    }
  };
}

export default defineConfig({
  base: './', // caminhos relativos: funciona em www.epasb.ao e em epasbep.github.io/site-epasb
  plugins: [react(), cabecaComum(), paginasDeNoticias()],
  build: {
    rollupOptions: {
      input: Object.fromEntries(PAGINAS.map((p) => [p.replace('/', '-'), resolve(import.meta.dirname, `${p}.html`)]))
    }
  },
  server: { port: 5173, strictPort: true }
});
