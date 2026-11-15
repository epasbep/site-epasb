// Peças comuns do painel administrativo: sessão (Supabase Auth) e barra do topo.
import { useEffect, useState } from 'react';
import { sb } from '../supabase.js';
import { pub } from '../util.js';

// undefined = a verificar, null = sem sessão, objecto = sessão iniciada
export function useSessao() {
  const [sessao, setSessao] = useState(undefined);
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSessao(data.session));
    const { data } = sb.auth.onAuthStateChange((_evento, s) => setSessao(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return sessao;
}

export function Topo({ sessao, activa }) {
  const sair = async () => { await sb.auth.signOut(); location.href = 'index.html'; };
  const link = (href, nome) => <a href={href} aria-current={href === activa ? 'page' : undefined}>{nome}</a>;
  return (
    <header className="admin-topo">
      <div className="container admin-topo__dentro">
        <img src={pub('assets/logo/logo-epasb-128.webp')} width="36" height="36" alt="" />
        <strong>Painel administrativo</strong>
        <nav aria-label="Painel">
          {link('index.html', 'Atendimentos')}
          {link('nova-noticia.html', 'Publicar notícia')}
          <a href="../index.html">Ver o site</a>
        </nav>
        <span style={{ fontSize: 14, color: '#D7ECF5' }}>{sessao.user.email}</span>
        <button className="admin-topo__sair" type="button" onClick={sair}>Sair</button>
      </div>
    </header>
  );
}
