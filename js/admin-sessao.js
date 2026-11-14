// Sessão do painel administrativo (Supabase Auth). Usado pelas páginas em /admin.
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

export const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

export async function obterSessao() {
  const { data } = await sb.auth.getSession();
  return data.session;
}

// Preenche o nome de quem entrou e liga o botão "Sair".
export function ligarTopo(sessao) {
  const quem = document.getElementById('quem');
  if (quem) quem.textContent = sessao.user.email;
  document.getElementById('sair').addEventListener('click', async () => {
    await sb.auth.signOut();
    location.href = 'index.html';
  });
}
