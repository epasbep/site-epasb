// Peças comuns do painel administrativo: sessão, papel (RBAC), barra do topo e protecção das páginas.
//
// IMPORTANTE: esconder menus e botões é só conforto. Quem garante as permissões é a base de dados
// (regras em supabase/fase1-papeis.sql): mesmo que alguém force um pedido, o Supabase recusa-o.
import { useEffect, useState } from 'react';
import { sb } from '../supabase.js';
import { pub } from '../util.js';

export const PAPEIS = {
  super_admin: 'Super Administrador',
  gestor: 'Gestor',
  editor: 'Editor',
  atendimento: 'Atendimento'
};

// Páginas do painel e quem as pode abrir
export const MENU = [
  ['index.html', 'Atendimentos', ['super_admin', 'atendimento', 'gestor']],
  ['noticias.html', 'Notícias', ['super_admin', 'gestor', 'editor']],
  ['avisos.html', 'Avisos', ['super_admin', 'gestor']],
  ['utilizadores.html', 'Utilizadores', ['super_admin']],
  ['auditoria.html', 'Auditoria', ['super_admin']],
  ['conta.html', 'A minha conta', Object.keys(PAPEIS)]
];

export const pode = (perfil, papeis) => !!perfil && papeis.includes(perfil.papel);
export const primeiraPagina = (perfil) => MENU.find(([, , papeis]) => pode(perfil, papeis))?.[0] || 'conta.html';

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

// Sessão + perfil (papel). perfil: undefined = a carregar, null = sem papel ou conta desactivada.
export function useAcesso() {
  const sessao = useSessao();
  const [perfil, setPerfil] = useState(undefined);
  const id = sessao?.user?.id;
  useEffect(() => {
    if (sessao === undefined) return;
    if (!sessao) { setPerfil(null); return; }
    setPerfil(undefined);
    sb.from('perfis').select('papel, activo, nome, email').eq('user_id', id).maybeSingle()
      .then(({ data }) => setPerfil(data?.activo ? data : null));
  }, [id, sessao === null]);
  return { sessao, perfil };
}

export async function sair() {
  await sb.auth.signOut();
  location.href = 'index.html';
}

export function Topo({ sessao, perfil, activa }) {
  return (
    <header className="admin-topo">
      <div className="container admin-topo__dentro">
        <img src={pub('assets/logo/logo-epasb-128.webp')} width="36" height="36" alt="" />
        <strong>Painel administrativo</strong>
        <nav aria-label="Painel">
          {MENU.filter(([, , papeis]) => pode(perfil, papeis)).map(([href, nome]) => (
            <a key={href} href={href} aria-current={href === activa ? 'page' : undefined}>{nome}</a>
          ))}
          <a href="../index.html">Ver o site</a>
        </nav>
        <span className="admin-topo__quem">{perfil?.nome || sessao.user.email}{perfil && <small>{PAPEIS[perfil.papel]}</small>}</span>
        <button className="admin-topo__sair" type="button" onClick={sair}>Sair</button>
      </div>
    </header>
  );
}

export function Creditos() {
  return (
    <p className="creditos container">
      Desenvolvimento e Consultoria: GGS · Consultor Tecnológico e Web Designer: Afonso Panzo · Todos os direitos reservados.
    </p>
  );
}

function SemAcesso({ sessao, perfil, texto }) {
  return (
    <>
      {perfil ? <Topo sessao={sessao} perfil={perfil} /> : null}
      <main className="container admin">
        <div className="form" style={{ maxWidth: 560 }}>
          <h1 className="h3">Sem acesso</h1>
          <p className="texto">{texto}</p>
          <div className="botoes">
            {perfil && <a className="btn btn--primario" href={primeiraPagina(perfil)}>Ir para o painel</a>}
            <button className="btn btn--secundario" type="button" onClick={sair}>Sair</button>
          </div>
        </div>
      </main>
    </>
  );
}

// Envolve uma página do painel: exige sessão, um papel activo e um dos papéis indicados.
// children é uma função que recebe { sessao, perfil }.
export function Painel({ papeis, activa, children }) {
  const { sessao, perfil } = useAcesso();
  useEffect(() => { if (sessao === null) location.replace('index.html'); }, [sessao]);
  if (!sessao || perfil === undefined) return null;
  if (!perfil) {
    return <SemAcesso sessao={sessao} texto="A sua conta ainda não tem um papel atribuído ou foi desactivada. Peça acesso ao Super Administrador." />;
  }
  if (!pode(perfil, papeis)) {
    return <SemAcesso sessao={sessao} perfil={perfil} texto={`O seu papel (${PAPEIS[perfil.papel]}) não dá acesso a esta página.`} />;
  }
  return (
    <>
      <Topo sessao={sessao} perfil={perfil} activa={activa} />
      {children({ sessao, perfil })}
      <Creditos />
    </>
  );
}
