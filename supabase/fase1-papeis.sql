-- =====================================================================
-- EPASB-EP — Fase 1: papéis de acesso (RBAC), aprovação de notícias,
-- auditoria e protecção contra envios em massa.
--
-- ANTES DE CORRER: escreva o seu email na linha marcada com  <<<  (secção 1).
-- Essa conta passa a ser Super Administrador. As outras contas existentes
-- ficam sem acesso até o Super Administrador lhes dar um papel no painel
-- (Painel → Utilizadores).
--
-- COMO USAR: SQL Editor → New query → colar este ficheiro → Run.
-- Requer que supabase/instalar.sql já tenha sido corrido.
-- Pode ser corrido mais do que uma vez.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PAPÉIS
--    super_admin  — tudo, incluindo utilizadores, auditoria e configurações
--    gestor       — notícias, avisos, aprovação de conteúdos, relatórios de atendimento
--    editor       — cria e edita os seus conteúdos; não publica
--    atendimento  — pedidos dos cidadãos: ver, responder, mudar estado
-- ---------------------------------------------------------------------

-- Se já existir uma tabela "perfis" antiga (com outras colunas, por exemplo id/role),
-- é guardada como "perfis_antigo" (os dados não se perdem) e cria-se a nova.
-- Qualquer trigger antigo em auth.users que escrevia nessa tabela é desligado,
-- porque impediria a criação de contas novas.
do $$
declare t record;
begin
  if to_regclass('public.perfis') is not null and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'perfis' and column_name = 'papel'
  ) then
    if to_regclass('public.perfis_antigo') is not null then
      execute 'alter table public.perfis rename to perfis_antigo_' || to_char(now(), 'YYYYMMDDHH24MISS');
    else
      alter table public.perfis rename to perfis_antigo;
    end if;
    raise notice 'A tabela perfis antiga foi guardada com outro nome (perfis_antigo).';
  end if;

  for t in
    select tg.tgname from pg_trigger tg join pg_proc p on p.oid = tg.tgfoid
    where tg.tgrelid = 'auth.users'::regclass and not tg.tgisinternal and p.prosrc ilike '%perfis%'
  loop
    execute format('drop trigger if exists %I on auth.users', t.tgname);
    raise notice 'Trigger antigo % em auth.users desligado.', t.tgname;
  end loop;
end $$;

create table if not exists public.perfis (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  email       text,
  nome        text,
  papel       text not null check (papel in ('super_admin', 'gestor', 'editor', 'atendimento')),
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.perfis enable row level security;

-- Papel de quem fez o pedido (null = cidadão, sistema ou conta sem papel/desactivada)
create or replace function public.papel_actual() returns text
language sql stable security definer set search_path = public as $$
  select papel from public.perfis where user_id = auth.uid() and activo
$$;

create or replace function public.tem_papel(variadic papeis text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.papel_actual() = any (papeis), false)
$$;

grant execute on function public.papel_actual() to anon, authenticated;
grant execute on function public.tem_papel(text[]) to anon, authenticated;

drop policy if exists "perfis: ver" on public.perfis;
create policy "perfis: ver" on public.perfis
  for select to authenticated using (user_id = auth.uid() or public.tem_papel('super_admin'));
-- Criar, alterar e remover perfis só pela função "gerir-utilizadores" (servidor).

-- Primeiro Super Administrador
do $$
declare
  email_super text := 'COLOQUE-AQUI-O-SEU-EMAIL';  -- <<< escreva aqui o seu email
begin
  if email_super = 'COLOQUE-AQUI-O-SEU-EMAIL' then
    raise exception 'Escreva o seu email na linha marcada com <<< (secção 1) e corra de novo.';
  end if;
  insert into public.perfis (user_id, email, papel)
  select id, email, 'super_admin' from auth.users where lower(email) = lower(trim(email_super))
  on conflict (user_id) do update set papel = 'super_admin', activo = true;
  if not found then
    raise exception 'Não existe nenhuma conta com o email %. Crie-a em Authentication → Users e corra de novo.', email_super;
  end if;
end $$;


-- ---------------------------------------------------------------------
-- 2. NOTÍCIAS — fluxo Editor → Gestor → publicação
--    rascunho → revisao → publicado   (ou devolvido, com nota do Gestor)
-- ---------------------------------------------------------------------
alter table public.noticias add column if not exists estado text not null default 'publicado'
  check (estado in ('rascunho', 'revisao', 'devolvido', 'publicado'));
alter table public.noticias alter column estado set default 'rascunho';
alter table public.noticias add column if not exists criado_por uuid references auth.users (id) on delete set null;
alter table public.noticias add column if not exists revisto_por uuid references auth.users (id) on delete set null;
alter table public.noticias add column if not exists nota_revisao text;
alter table public.noticias add column if not exists publicado_em timestamptz;

create or replace function public.noticias_regras() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  p text := public.papel_actual();
begin
  if auth.uid() is null then return new; end if;  -- SQL Editor / sistema
  if tg_op = 'INSERT' then new.criado_por := auth.uid(); end if;
  if p = 'editor' and new.estado not in ('rascunho', 'revisao') then
    raise exception 'Os editores não publicam: envie a notícia para revisão.';
  end if;
  if new.estado = 'publicado' and (tg_op = 'INSERT' or old.estado <> 'publicado') then
    new.revisto_por := auth.uid();
    if tg_op = 'INSERT' or old.publicado_em is null then
      new.publicado_em := now();
      new.date := current_date;   -- a data da notícia é a da primeira publicação
    end if;
  end if;
  return new;
end $$;

drop trigger if exists noticias_regras on public.noticias;
create trigger noticias_regras before insert or update on public.noticias
  for each row execute function public.noticias_regras();

drop policy if exists "noticias: leitura publica" on public.noticias;
drop policy if exists "noticias: escrita autenticada" on public.noticias;
drop policy if exists "noticias: publico ve publicadas" on public.noticias;
drop policy if exists "noticias: equipa ve" on public.noticias;
drop policy if exists "noticias: criar" on public.noticias;
drop policy if exists "noticias: alterar" on public.noticias;
drop policy if exists "noticias: apagar" on public.noticias;

create policy "noticias: publico ve publicadas" on public.noticias
  for select to anon using (estado = 'publicado');
create policy "noticias: equipa ve" on public.noticias
  for select to authenticated using (estado = 'publicado' or public.tem_papel('super_admin', 'gestor', 'editor'));
create policy "noticias: criar" on public.noticias
  for insert to authenticated with check (public.tem_papel('super_admin', 'gestor', 'editor'));
create policy "noticias: alterar" on public.noticias
  for update to authenticated
  using (public.tem_papel('super_admin', 'gestor') or (public.tem_papel('editor') and criado_por = auth.uid() and estado <> 'publicado'))
  with check (public.tem_papel('super_admin', 'gestor') or (public.tem_papel('editor') and criado_por = auth.uid() and estado in ('rascunho', 'revisao')));
create policy "noticias: apagar" on public.noticias
  for delete to authenticated
  using (public.tem_papel('super_admin', 'gestor') or (public.tem_papel('editor') and criado_por = auth.uid() and estado <> 'publicado'));

-- Fotografias e vídeos das notícias
drop policy if exists "noticias: enviar ficheiros" on storage.objects;
drop policy if exists "noticias: apagar ficheiros" on storage.objects;
create policy "noticias: enviar ficheiros" on storage.objects
  for insert to authenticated with check (bucket_id = 'noticias' and public.tem_papel('super_admin', 'gestor', 'editor'));
create policy "noticias: apagar ficheiros" on storage.objects
  for delete to authenticated using (bucket_id = 'noticias' and (public.tem_papel('super_admin', 'gestor') or owner = auth.uid()));


-- ---------------------------------------------------------------------
-- 3. AVISOS — só Gestor e Super Administrador
-- ---------------------------------------------------------------------
drop policy if exists "avisos: gestao autenticada" on public.avisos;
drop policy if exists "avisos: gestao" on public.avisos;
drop policy if exists "avisos: leitura equipa" on public.avisos;
create policy "avisos: gestao" on public.avisos
  for all to authenticated using (public.tem_papel('super_admin', 'gestor')) with check (public.tem_papel('super_admin', 'gestor'));
create policy "avisos: leitura equipa" on public.avisos
  for select to authenticated using (activo and (fim is null or fim > now()));


-- ---------------------------------------------------------------------
-- 4. ATENDIMENTOS — dados pessoais só para Atendimento e Super Administrador
-- ---------------------------------------------------------------------
alter table public.atendimentos enable row level security;
do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'atendimentos' loop
    execute format('drop policy %I on public.atendimentos', r.policyname);
  end loop;
end $$;

create policy "atendimentos: cidadao envia" on public.atendimentos
  for insert to anon, authenticated with check (coalesce(status, 'Novo') = 'Novo' and resposta is null);
create policy "atendimentos: equipa ve" on public.atendimentos
  for select to authenticated using (public.tem_papel('super_admin', 'atendimento'));
create policy "atendimentos: equipa responde" on public.atendimentos
  for update to authenticated using (public.tem_papel('super_admin', 'atendimento')) with check (public.tem_papel('super_admin', 'atendimento'));
create policy "atendimentos: super admin apaga" on public.atendimentos
  for delete to authenticated using (public.tem_papel('super_admin'));

-- Documentos anexados pelos cidadãos
do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname = 'storage' and tablename = 'objects'
             and (coalesce(qual, '') like '%atendimentos%' or coalesce(with_check, '') like '%atendimentos%') loop
    execute format('drop policy %I on storage.objects', r.policyname);
  end loop;
end $$;
create policy "atendimentos: cidadao anexa" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'atendimentos' and (storage.foldername(name))[1] = 'documentos');
create policy "atendimentos: equipa abre anexos" on storage.objects
  for select to authenticated using (bucket_id = 'atendimentos' and public.tem_papel('super_admin', 'atendimento'));
create policy "atendimentos: super admin apaga anexos" on storage.objects
  for delete to authenticated using (bucket_id = 'atendimentos' and public.tem_papel('super_admin'));

-- Protecção contra envios em massa: no máximo 3 pedidos por email por hora
-- e 60 pedidos no total em 10 minutos.
create or replace function public.atendimentos_limite() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.papel_actual() is not null then return new; end if;  -- a equipa não tem limite
  if char_length(coalesce(new.mensagem, '')) > 5000 then
    raise exception 'A mensagem é demasiado longa (máximo 5000 caracteres).';
  end if;
  if (select count(*) from public.atendimentos
      where lower(email) = lower(new.email) and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'Demasiados pedidos seguidos com este email. Tente de novo dentro de uma hora.';
  end if;
  if (select count(*) from public.atendimentos where created_at > now() - interval '10 minutes') >= 60 then
    raise exception 'O serviço está a receber demasiados pedidos. Tente de novo dentro de alguns minutos.';
  end if;
  return new;
end $$;

drop trigger if exists atendimentos_limite on public.atendimentos;
create trigger atendimentos_limite before insert on public.atendimentos
  for each row execute function public.atendimentos_limite();

-- Relatório para o Gestor: só números, sem dados pessoais
create or replace function public.estatisticas_atendimento()
returns table (mes date, status text, assunto text, total bigint)
language sql stable security definer set search_path = public as $$
  select date_trunc('month', created_at)::date, coalesce(status, 'Novo'), coalesce(assunto, '-'), count(*)
  from public.atendimentos
  where public.tem_papel('super_admin', 'gestor', 'atendimento')
  group by 1, 2, 3
  order by 1 desc;
$$;
revoke all on function public.estatisticas_atendimento() from public;
grant execute on function public.estatisticas_atendimento() to authenticated;


-- ---------------------------------------------------------------------
-- 5. AUDITORIA — quem fez o quê no painel
--    Nos atendimentos só se registam o estado e a resposta, nunca os dados pessoais.
-- ---------------------------------------------------------------------
create table if not exists public.auditoria (
  id         bigint generated always as identity primary key,
  quando     timestamptz not null default now(),
  user_id    uuid,
  email      text,
  papel      text,
  accao      text not null,
  tabela     text not null,
  registo    text,
  detalhe    jsonb
);
create index if not exists auditoria_quando on public.auditoria (quando desc);
alter table public.auditoria enable row level security;

drop policy if exists "auditoria: super admin le" on public.auditoria;
create policy "auditoria: super admin le" on public.auditoria
  for select to authenticated using (public.tem_papel('super_admin'));

create or replace function public.registar_auditoria() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  antes jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  depois jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  linha jsonb := coalesce(depois, antes);
  privados text[] := array['nome', 'email', 'telefone', 'mensagem', 'documento_url'];
  det jsonb;
begin
  if auth.uid() is null then return null; end if;  -- cidadãos e sistema não ficam registados
  if tg_op = 'UPDATE' then
    select jsonb_object_agg(k, jsonb_build_object('antes', antes -> k, 'depois', depois -> k)) into det
    from jsonb_object_keys(depois) as k
    where depois -> k is distinct from antes -> k
      and k not in ('updated_at', 'atualizado_at')
      and not (tg_table_name = 'atendimentos' and k = any (privados));
    if det is null then return null; end if;
  else
    det := jsonb_strip_nulls(jsonb_build_object(
      'titulo', linha ->> 'title', 'texto', linha ->> 'texto', 'codigo', linha ->> 'codigo',
      'estado', coalesce(linha ->> 'estado', linha ->> 'status'), 'papel', linha ->> 'papel'));
  end if;
  insert into public.auditoria (user_id, email, papel, accao, tabela, registo, detalhe)
  values (auth.uid(), (select email from auth.users where id = auth.uid()), public.papel_actual(),
          lower(tg_op), tg_table_name, coalesce(linha ->> 'id', linha ->> 'user_id'), det);
  return null;
end $$;

drop trigger if exists auditoria on public.noticias;
create trigger auditoria after insert or update or delete on public.noticias for each row execute function public.registar_auditoria();
drop trigger if exists auditoria on public.avisos;
create trigger auditoria after insert or update or delete on public.avisos for each row execute function public.registar_auditoria();
drop trigger if exists auditoria on public.atendimentos;
create trigger auditoria after update or delete on public.atendimentos for each row execute function public.registar_auditoria();
