import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Cada página do site é uma entrada própria (os endereços ficam iguais: sobre.html, noticias.html…).
const PAGINAS = ['index', 'sobre', 'organigrama', 'estatutos', 'noticias', 'noticia', 'contacto', 'admin/index', 'admin/nova-noticia'];

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

export default defineConfig({
  base: './', // caminhos relativos: funciona em www.epasb.ao e em epasbep.github.io/site-epasb
  plugins: [react(), cabecaComum()],
  build: {
    rollupOptions: {
      input: Object.fromEntries(PAGINAS.map((p) => [p.replace('/', '-'), resolve(import.meta.dirname, `${p}.html`)]))
    }
  },
  server: { port: 5173, strictPort: true }
});
