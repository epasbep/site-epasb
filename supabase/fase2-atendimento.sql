-- =====================================================================
-- EPASB-EP — Fase 2 (parte 1): gestão de reclamações e atendimentos.
--
--  - Estados: Recebida → Em análise → Em tratamento → Resolvida → Encerrada
--  - Categoria, prioridade e responsável (da equipa de Atendimento)
--  - Histórico completo: mudanças de estado, respostas ao cidadão e notas internas
--  - O cidadão, com o número do pedido, vê o estado e as respostas (nunca as notas internas)
--
-- COMO USAR: SQL Editor → New query → colar este ficheiro → Run.
-- Requer instalar.sql e fase1-papeis.sql. Pode ser corrido mais do que uma vez.
-- Funciona com a versão antiga e com a nova do site (os estados antigos são convertidos).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Limpeza: a tabela antiga "perfis_antigo" (guardada na Fase 1) tinha uma regra que deixava
--    qualquer conta com sessão ler os perfis antigos. Os dados ficam, mas deixam de ser legíveis.
-- ---------------------------------------------------------------------
do $$
declare r record;
begin
  if to_regclass('public.perfis_antigo') is not null then
    for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'perfis_antigo' loop
      execute format('drop policy %I on public.perfis_antigo', r.policyname);
    end loop;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 1. Colunas novas
-- ---------------------------------------------------------------------
alter table public.atendimentos add column if not exists categoria   text;
alter table public.atendimentos add column if not exists prioridade  text not null default 'Normal';
alter table public.atendimentos add column if not exists responsavel uuid references auth.users (id) on delete set null;

-- Estados antigos → novos. Qualquer outro nome (escrito à mão, com outra grafia, vazio…) é convertido
-- pelo sentido; o que não se reconhecer fica "Recebida", para a equipa o rever.
alter table public.atendimentos drop constraint if exists atendimentos_status_valido;
update public.atendimentos set status = case
    when status in ('Recebida', 'Em análise', 'Em tratamento', 'Resolvida', 'Encerrada') then status
    when status ilike '%encerr%' or status ilike '%fechad%' or status ilike '%conclu%' or status ilike '%arquiv%' then 'Encerrada'
    when status ilike '%resolv%' or status ilike '%respond%' or status ilike '%respost%' then 'Resolvida'
    when status ilike '%trat%' or status ilike '%curso%' or status ilike '%andamento%' or status ilike '%execu%' then 'Em tratamento'
    when status ilike '%anal%' or status ilike '%pendent%' then 'Em análise'
    else 'Recebida'
  end
where status is null or status not in ('Recebida', 'Em análise', 'Em tratamento', 'Resolvida', 'Encerrada');
alter table public.atendimentos alter column status set default 'Recebida';

alter table public.atendimentos drop constraint if exists atendimentos_status_valido;
alter table public.atendimentos add constraint atendimentos_status_valido
  check (status in ('Recebida', 'Em análise', 'Em tratamento', 'Resolvida', 'Encerrada'));
alter table public.atendimentos drop constraint if exists atendimentos_prioridade_valida;
alter table public.atendimentos add constraint atendimentos_prioridade_valida
  check (prioridade in ('Baixa', 'Normal', 'Alta', 'Urgente'));

create index if not exists atendimentos_status on public.atendimentos (status);
create index if not exists atendimentos_responsavel on public.atendimentos (responsavel);

-- O cidadão envia sempre como "Recebida" (aceita-se "Novo" da versão antiga do formulário).
drop policy if exists "atendimentos: cidadao envia" on public.atendimentos;
create policy "atendimentos: cidadao envia" on public.atendimentos
  for insert to anon, authenticated
  with check (coalesce(status, 'Recebida') in ('Recebida', 'Novo') and resposta is null and responsavel is null);

-- Normaliza estados antigos e impede o cidadão de escolher prioridade, categoria ou responsável.
create or replace function public.atendimentos_normalizar() returns trigger
language plpgsql set search_path = public as $$
begin
  new.status := case coalesce(new.status, 'Recebida')
    when 'Novo' then 'Recebida' when 'Respondido' then 'Resolvida' when 'Encerrado' then 'Encerrada' else new.status end;
  if tg_op = 'INSERT' and public.papel_actual() is null then
    new.prioridade := 'Normal';
    new.categoria := null;
    new.responsavel := null;
  end if;
  return new;
end $$;
drop trigger if exists atendimentos_normalizar on public.atendimentos;
create trigger atendimentos_normalizar before insert or update on public.atendimentos
  for each row execute function public.atendimentos_normalizar();


-- ---------------------------------------------------------------------
-- 2. Histórico
--    tipo: criado | estado | resposta | nota | prioridade | categoria | responsavel
--    publico = true → o cidadão vê (estado e respostas); notas internas nunca são públicas.
-- ---------------------------------------------------------------------
create table if not exists public.atendimentos_historico (
  id             bigint generated always as identity primary key,
  atendimento_id bigint not null references public.atendimentos (id) on delete cascade,
  quando         timestamptz not null default now(),
  user_id        uuid,
  autor          text,
  tipo           text not null,
  de             text,
  para           text,
  texto          text,
  publico        boolean not null default false
);
create index if not exists atendimentos_historico_pedido on public.atendimentos_historico (atendimento_id, quando);
alter table public.atendimentos_historico enable row level security;

drop policy if exists "historico: equipa ve" on public.atendimentos_historico;
create policy "historico: equipa ve" on public.atendimentos_historico
  for select to authenticated using (public.tem_papel('super_admin', 'atendimento'));
-- A equipa só acrescenta notas internas à mão; o resto é escrito pelo trigger abaixo.
drop policy if exists "historico: equipa anota" on public.atendimentos_historico;
create policy "historico: equipa anota" on public.atendimentos_historico
  for insert to authenticated
  with check (public.tem_papel('super_admin', 'atendimento') and tipo = 'nota' and publico = false
              and user_id = auth.uid() and char_length(coalesce(texto, '')) between 1 and 5000);

-- Nas notas escritas à mão, o nome do autor é preenchido pela base de dados (não pelo browser).
create or replace function public.historico_autor() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    new.user_id := auth.uid();
    new.autor := (select coalesce(nullif(p.nome, ''), p.email) from public.perfis p where p.user_id = auth.uid());
  end if;
  new.quando := now();
  return new;
end $$;
drop trigger if exists historico_autor on public.atendimentos_historico;
create trigger historico_autor before insert on public.atendimentos_historico
  for each row when (new.tipo = 'nota') execute function public.historico_autor();

create or replace function public.atendimentos_registar_historico() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  quem uuid := auth.uid();
  nome text := (select coalesce(nullif(p.nome, ''), p.email) from public.perfis p where p.user_id = auth.uid());
  nome_de text;
  nome_para text;
begin
  if tg_op = 'INSERT' then
    insert into public.atendimentos_historico (atendimento_id, tipo, para, publico)
    values (new.id, 'criado', new.status, true);
    return null;
  end if;
  if new.status is distinct from old.status then
    insert into public.atendimentos_historico (atendimento_id, user_id, autor, tipo, de, para, publico)
    values (new.id, quem, nome, 'estado', old.status, new.status, true);
  end if;
  if coalesce(new.resposta, '') <> '' and new.resposta is distinct from old.resposta then
    insert into public.atendimentos_historico (atendimento_id, user_id, autor, tipo, texto, publico)
    values (new.id, quem, nome, 'resposta', new.resposta, true);
  end if;
  if new.prioridade is distinct from old.prioridade then
    insert into public.atendimentos_historico (atendimento_id, user_id, autor, tipo, de, para)
    values (new.id, quem, nome, 'prioridade', old.prioridade, new.prioridade);
  end if;
  if new.categoria is distinct from old.categoria then
    insert into public.atendimentos_historico (atendimento_id, user_id, autor, tipo, de, para)
    values (new.id, quem, nome, 'categoria', old.categoria, new.categoria);
  end if;
  if new.responsavel is distinct from old.responsavel then
    select coalesce(nullif(p.nome, ''), p.email) into nome_de from public.perfis p where p.user_id = old.responsavel;
    select coalesce(nullif(p.nome, ''), p.email) into nome_para from public.perfis p where p.user_id = new.responsavel;
    insert into public.atendimentos_historico (atendimento_id, user_id, autor, tipo, de, para)
    values (new.id, quem, nome, 'responsavel', nome_de, nome_para);
  end if;
  return null;
end $$;
drop trigger if exists atendimentos_historico on public.atendimentos;
create trigger atendimentos_historico after insert or update on public.atendimentos
  for each row execute function public.atendimentos_registar_historico();

-- Pedidos já existentes: um registo inicial (e a resposta, se houver), só uma vez.
insert into public.atendimentos_historico (atendimento_id, quando, tipo, para, publico)
select a.id, a.created_at, 'criado', 'Recebida', true from public.atendimentos a
where not exists (select 1 from public.atendimentos_historico h where h.atendimento_id = a.id);
insert into public.atendimentos_historico (atendimento_id, quando, tipo, texto, publico)
select a.id, coalesce(a.atualizado_at, a.created_at), 'resposta', a.resposta, true from public.atendimentos a
where coalesce(a.resposta, '') <> ''
  and not exists (select 1 from public.atendimentos_historico h where h.atendimento_id = a.id and h.tipo = 'resposta');


-- ---------------------------------------------------------------------
-- 3. Equipa que pode ser responsável (para a lista "Responsável")
-- ---------------------------------------------------------------------
create or replace function public.equipa_atendimento()
returns table (user_id uuid, nome text, email text, papel text)
language sql stable security definer set search_path = public as $$
  select p.user_id, p.nome, p.email, p.papel from public.perfis p
  where p.activo and p.papel in ('super_admin', 'atendimento')
    and public.tem_papel('super_admin', 'atendimento')
  order by coalesce(nullif(p.nome, ''), p.email);
$$;
revoke all on function public.equipa_atendimento() from public;
grant execute on function public.equipa_atendimento() to authenticated;


-- ---------------------------------------------------------------------
-- 4. Consulta pública do histórico (com o número do pedido): estados e respostas, sem nomes da equipa
-- ---------------------------------------------------------------------
create or replace function public.consultar_pedido_historico(p_codigo text)
returns table (quando timestamptz, tipo text, para text, texto text)
language sql stable security definer set search_path = public as $$
  select h.quando, h.tipo, h.para, h.texto
  from public.atendimentos_historico h
  join public.atendimentos a on a.id = h.atendimento_id
  where p_codigo is not null and char_length(p_codigo) between 6 and 20
    and a.codigo = upper(trim(p_codigo)) and h.publico
  order by h.quando;
$$;
revoke all on function public.consultar_pedido_historico(text) from public;
grant execute on function public.consultar_pedido_historico(text) to anon, authenticated;


-- ---------------------------------------------------------------------
-- 5. Relatório (Gestor): agora também por prioridade e tempo médio de resolução — sempre sem dados pessoais
-- ---------------------------------------------------------------------
drop function if exists public.estatisticas_atendimento();
create or replace function public.estatisticas_atendimento()
returns table (mes date, status text, assunto text, prioridade text, total bigint, horas_resolucao numeric)
language sql stable security definer set search_path = public as $$
  select date_trunc('month', a.created_at)::date, a.status, coalesce(a.assunto, '-'), a.prioridade, count(*),
         round(avg(extract(epoch from (r.quando - a.created_at)) / 3600)::numeric, 1)
  from public.atendimentos a
  left join lateral (
    select min(h.quando) as quando from public.atendimentos_historico h
    where h.atendimento_id = a.id and h.tipo = 'estado' and h.para in ('Resolvida', 'Encerrada')
  ) r on true
  where public.tem_papel('super_admin', 'gestor', 'atendimento')
  group by 1, 2, 3, 4
  order by 1 desc;
$$;
revoke all on function public.estatisticas_atendimento() from public;
grant execute on function public.estatisticas_atendimento() to authenticated;
