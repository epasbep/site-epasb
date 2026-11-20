// EPASB-EP — gestão de utilizadores do painel (só para o Super Administrador).
//
// Criar e apagar contas exige a chave de serviço do Supabase, que nunca pode ir para o browser.
// Esta função corre no servidor do Supabase, confirma que quem chama é Super Administrador
// e só então executa a acção. Cada acção fica registada na tabela "auditoria".
//
// Acções (corpo JSON { accao, ... }):
//   listar                                  → lista de contas com papel e último acesso
//   criar        { email, nome, papel, palavraPasse }
//   alterar      { id, papel?, activo?, nome? }
//   palavraPasse { id, palavraPasse }
//   remover      { id }
//
// Instalação: ver supabase/LEIA-ME.md (as variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
// são dadas automaticamente pelo Supabase).
import { createClient } from 'npm:@supabase/supabase-js@2';

const PAPEIS = ['super_admin', 'gestor', 'editor', 'atendimento'];
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const resposta = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const erro = (mensagem: string, status = 400) => resposta({ erro: mensagem }, status);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return erro('Método não permitido', 405);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // 1. Quem está a pedir?
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: quem } = await admin.auth.getUser(token);
  if (!quem?.user) return erro('Sessão inválida. Entre de novo no painel.', 401);
  const { data: eu } = await admin.from('perfis').select('papel, activo').eq('user_id', quem.user.id).maybeSingle();
  if (eu?.papel !== 'super_admin' || !eu.activo) return erro('Só o Super Administrador pode gerir utilizadores.', 403);

  const registar = (accao: string, registo: string, detalhe: Record<string, unknown>) =>
    admin.from('auditoria').insert({
      user_id: quem.user.id, email: quem.user.email, papel: 'super_admin',
      accao, tabela: 'utilizadores', registo, detalhe
    });

  // Nunca deixar o sistema sem nenhum Super Administrador activo
  const outrosSuperAdmins = async (excepto: string) => {
    const { count } = await admin.from('perfis').select('user_id', { count: 'exact', head: true })
      .eq('papel', 'super_admin').eq('activo', true).neq('user_id', excepto);
    return count ?? 0;
  };

  const d = await req.json().catch(() => ({}));
  try {
    switch (d.accao) {
      case 'listar': {
        const { data: contas, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 500 });
        if (error) throw error;
        const { data: perfis } = await admin.from('perfis').select('*');
        const porId = new Map((perfis ?? []).map((p) => [p.user_id, p]));
        return resposta(contas.users.map((u) => {
          const p = porId.get(u.id);
          return {
            id: u.id, email: u.email, nome: p?.nome ?? u.user_metadata?.nome ?? '',
            papel: p?.papel ?? null, activo: p?.activo ?? false,
            ultimoAcesso: u.last_sign_in_at, criado: u.created_at, eu: u.id === quem.user.id
          };
        }).sort((a, b) => (a.email ?? '').localeCompare(b.email ?? '')));
      }

      case 'criar': {
        const email = String(d.email ?? '').trim().toLowerCase();
        const nome = String(d.nome ?? '').trim();
        if (!/^\S+@\S+\.\S+$/.test(email)) return erro('Indique um email válido.');
        if (!PAPEIS.includes(d.papel)) return erro('Escolha um papel.');
        if (String(d.palavraPasse ?? '').length < 10) return erro('A palavra-passe tem de ter pelo menos 10 caracteres.');
        const { data, error } = await admin.auth.admin.createUser({
          email, password: d.palavraPasse, email_confirm: true, user_metadata: { nome }
        });
        if (error) return erro(/already/i.test(error.message) ? 'Já existe uma conta com este email.' : error.message);
        const { error: e2 } = await admin.from('perfis').insert({ user_id: data.user.id, email, nome, papel: d.papel });
        if (e2) { await admin.auth.admin.deleteUser(data.user.id); throw e2; }
        await registar('criar', data.user.id, { email, papel: d.papel });
        return resposta({ id: data.user.id });
      }

      case 'alterar': {
        const id = String(d.id ?? '');
        const mudancas: Record<string, unknown> = {};
        if (d.papel !== undefined) {
          if (!PAPEIS.includes(d.papel)) return erro('Papel inválido.');
          mudancas.papel = d.papel;
        }
        if (d.activo !== undefined) mudancas.activo = !!d.activo;
        if (d.nome !== undefined) mudancas.nome = String(d.nome).trim();
        const { data: conta } = await admin.auth.admin.getUserById(id);
        if (!conta?.user) return erro('Conta não encontrada.', 404);
        const { data: actual } = await admin.from('perfis').select('papel').eq('user_id', id).maybeSingle();

        const retiraSuper = (mudancas.papel && mudancas.papel !== 'super_admin') || mudancas.activo === false;
        if (id === quem.user.id && retiraSuper) return erro('Não pode retirar o seu próprio acesso de Super Administrador.');
        if (retiraSuper && actual?.papel === 'super_admin' && (await outrosSuperAdmins(id)) === 0) {
          return erro('Tem de existir pelo menos um Super Administrador activo.');
        }
        // Contas criadas antes dos papéis existirem ainda não têm perfil: precisam de um papel para o ter.
        if (!actual && !mudancas.papel) return erro('Escolha primeiro um papel para esta conta.');
        const { error } = await admin.from('perfis').upsert({
          user_id: id, email: conta.user.email, papel: mudancas.papel ?? actual!.papel, ...mudancas
        });
        if (error) throw error;
        await registar('alterar', id, { email: conta.user.email, ...mudancas });
        return resposta({ ok: true });
      }

      case 'palavraPasse': {
        if (String(d.palavraPasse ?? '').length < 10) return erro('A palavra-passe tem de ter pelo menos 10 caracteres.');
        const { error } = await admin.auth.admin.updateUserById(String(d.id), { password: d.palavraPasse });
        if (error) throw error;
        await registar('palavra-passe', String(d.id), {});
        return resposta({ ok: true });
      }

      case 'remover': {
        const id = String(d.id ?? '');
        if (id === quem.user.id) return erro('Não pode remover a sua própria conta.');
        const { data: alvo } = await admin.from('perfis').select('papel, email').eq('user_id', id).maybeSingle();
        if (alvo?.papel === 'super_admin' && (await outrosSuperAdmins(id)) === 0) {
          return erro('Tem de existir pelo menos um Super Administrador activo.');
        }
        const { error } = await admin.auth.admin.deleteUser(id);
        if (error) throw error;
        await registar('remover', id, { email: alvo?.email ?? null });
        return resposta({ ok: true });
      }

      default:
        return erro('Acção desconhecida.');
    }
  } catch (e) {
    console.error(e);
    return erro('Erro no servidor: ' + (e instanceof Error ? e.message : String(e)), 500);
  }
});
