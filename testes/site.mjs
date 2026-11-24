// Testes do site publicado: todas as páginas do sitemap abrem, têm título e descrição próprios,
// política de segurança (CSP), imagem de partilha válida, e o painel não aparece no Google.
//
// Correr:  node testes/site.mjs [endereço]   (por omissão, o site no GitHub Pages)
const SITE = (process.argv[2] || process.env.SITE_TESTE || 'https://epasbep.github.io/site-epasb/').replace(/\/?$/, '/');

let falhas = 0;
const ok = (nome) => console.log(`  ✔ ${nome}`);
const erro = (nome, det) => { falhas++; console.log(`  ✘ ${nome}${det ? ` — ${det}` : ''}`); };
const meta = (html, re) => (html.match(re) || [])[1];

async function abrir(url) {
  const inicio = performance.now();
  const r = await fetch(url, { redirect: 'follow' });
  return { r, html: await r.text(), ms: Math.round(performance.now() - inicio) };
}

console.log(`\nSite: ${SITE}`);

console.log('\nPáginas do sitemap');
const { r: rs, html: sitemap } = await abrir(`${SITE}sitemap.xml`);
if (!rs.ok) { erro('sitemap.xml', `estado ${rs.status}`); process.exit(1); }
// O sitemap tem os endereços do domínio oficial; aqui testam-se no site indicado.
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const base = locs.reduce((a, b) => (a.length <= b.length ? a : b)); // o endereço mais curto é a página inicial
const caminhos = locs.map((l) => l.slice(base.length));
ok(`sitemap.xml com ${caminhos.length} endereços`);
const titulos = new Map();
for (const c of caminhos) {
  const { r, html, ms } = await abrir(SITE + c);
  const nome = '/' + c;
  if (!r.ok) { erro(nome, `estado ${r.status}`); continue; }
  const titulo = meta(html, /<title>([^<]*)<\/title>/);
  const desc = meta(html, /<meta name="description" content="([^"]*)"/);
  const problemas = [];
  if (!titulo) problemas.push('sem título');
  if (!desc || desc.length < 50) problemas.push('descrição curta');
  if (!html.includes('Content-Security-Policy')) problemas.push('sem CSP');
  if (!/<html lang="pt-AO"/.test(html)) problemas.push('sem lang');
  if (titulos.has(titulo) && !c.startsWith('noticia-')) problemas.push(`título repetido de ${titulos.get(titulo)}`);
  titulos.set(titulo, nome);
  if (ms > 3000) problemas.push(`lenta (${ms} ms)`);
  problemas.length ? erro(nome, problemas.join(', ')) : ok(`${nome} (${ms} ms)`);
}

console.log('\nImagens de partilha (Facebook, WhatsApp)');
{
  const { html } = await abrir(SITE);
  const img = meta(html, /<meta property="og:image" content="([^"]*)"/);
  if (!img) erro('og:image na página inicial');
  else {
    const local = SITE + img.replace(/^https?:\/\/[^/]+\//, '');
    const r = await fetch(local);
    r.ok && /image/.test(r.headers.get('content-type') || '') ? ok('imagem de partilha existe') : erro('imagem de partilha', `estado ${r.status}`);
  }
}

console.log('\nPainel e endereços antigos');
{
  const { r, html } = await abrir(`${SITE}admin/`);
  r.ok ? ok('painel abre') : erro('painel', `estado ${r.status}`);
  /noindex/.test(html) ? ok('painel marcado para não aparecer no Google') : erro('painel sem noindex');
  const robots = await (await fetch(`${SITE}robots.txt`)).text();
  /Disallow:\s*\/admin/i.test(robots) ? ok('robots.txt bloqueia /admin') : erro('robots.txt não bloqueia /admin');
  for (const antigo of ['sobre.html', 'contacto.html', 'pedido']) {
    const x = await fetch(SITE + antigo);
    x.ok ? ok(`endereço antigo /${antigo} continua a abrir`) : erro(`/${antigo}`, `estado ${x.status}`);
  }
}

console.log('\nFicheiros que nunca devem estar públicos');
for (const f of ['.env', 'package.json', 'supabase/fase1-papeis.sql', 'src/api.js', '.git/config']) {
  const x = await fetch(SITE + f);
  x.status >= 400 ? ok(`/${f} não existe no site`) : erro(`/${f} PÚBLICO`, `estado ${x.status}`);
}

console.log(falhas ? `\n${falhas} teste(s) falharam.\n` : '\nTodos os testes do site passaram.\n');
process.exit(falhas ? 1 : 0);
