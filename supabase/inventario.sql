-- =====================================================================
-- EPASB-EP — Inventário da base de dados (SÓ LEITURA: não altera nada).
-- Mostra a estrutura (tabelas, colunas, regras, triggers, funções) e contagens,
-- sem nomes, emails, telefones nem mensagens dos cidadãos.
--
-- COMO USAR: SQL Editor → New query → colar → Run → copiar o resultado (uma célula de texto).
-- =====================================================================
select jsonb_pretty(jsonb_build_object(

  'tabelas', (
    select jsonb_object_agg(t.table_name, jsonb_build_object(
      'linhas', (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from public.%I', t.table_name), false, true, '')))[1]::text::bigint,
      'colunas', (select jsonb_agg(c.column_name || ' ' || c.data_type
                                   || case when c.is_nullable = 'NO' then ' not null' else '' end
                                   || coalesce(' default ' || c.column_default, '') order by c.ordinal_position)
                  from information_schema.columns c
                  where c.table_schema = 'public' and c.table_name = t.table_name)))
    from information_schema.tables t
    where t.table_schema = 'public' and t.table_type = 'BASE TABLE'),

  'restricoes', (
    select jsonb_agg(conrelid::regclass::text || ': ' || conname || ' = ' || pg_get_constraintdef(oid) order by conrelid::regclass::text)
    from pg_constraint where connamespace = 'public'::regnamespace and contype in ('c', 'u', 'f')),

  'politicas_rls', (
    select jsonb_agg(schemaname || '.' || tablename || ' | ' || policyname || ' | ' || cmd || ' | ' || array_to_string(roles, ',')
                     || ' | using: ' || coalesce(qual, '-') || ' | check: ' || coalesce(with_check, '-') order by tablename, policyname)
    from pg_policies where schemaname in ('public', 'storage')),

  'rls_ligado', (
    select jsonb_object_agg(relname, relrowsecurity) from pg_class
    where relnamespace = 'public'::regnamespace and relkind = 'r'),

  'triggers', (
    select jsonb_agg(event_object_schema || '.' || event_object_table || ': ' || trigger_name || ' (' || action_timing || ' ' || event_manipulation || ')'
                     order by event_object_table, trigger_name)
    from information_schema.triggers where event_object_schema in ('public', 'auth')),

  'funcoes', (
    select jsonb_agg(p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' || case when p.prosecdef then ' [security definer]' else '' end order by p.proname)
    from pg_proc p where p.pronamespace = 'public'::regnamespace),

  'buckets_storage', (
    select jsonb_agg(jsonb_build_object('nome', id, 'publico', public, 'ficheiros', (select count(*) from storage.objects o where o.bucket_id = b.id)))
    from storage.buckets b),

  'atendimentos_por_estado', (
    select jsonb_object_agg(coalesce(status, '(vazio)'), n) from (select status, count(*) n from public.atendimentos group by status) x),
  'atendimentos_por_assunto', (
    select jsonb_object_agg(coalesce(assunto, '(vazio)'), n) from (select assunto, count(*) n from public.atendimentos group by assunto) x),
  'atendimentos_sem_numero', (select count(*) from public.atendimentos where codigo is null),

  'noticias_por_estado', (
    select jsonb_object_agg(coalesce(estado, '(vazio)'), n) from (select estado, count(*) n from public.noticias group by estado) x),

  'perfis_por_papel', (
    select jsonb_object_agg(papel || case when activo then '' else ' (desactivado)' end, n)
    from (select papel, activo, count(*) n from public.perfis group by papel, activo) x),
  'contas_sem_papel', (
    select count(*) from auth.users u where not exists (select 1 from public.perfis p where p.user_id = u.id)),

  'registo_de_contas', (select jsonb_build_object('contas', count(*), 'ultima_entrada', max(last_sign_in_at)) from auth.users)
)) as inventario;
