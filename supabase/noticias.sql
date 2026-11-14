-- =====================================================================
-- EPASB-EP — Notícias (tabela + armazenamento de fotografias e vídeos)
--
-- COMO USAR (uma única vez):
--   1. Abrir o projecto em https://supabase.com/dashboard
--   2. Menu "SQL Editor" → "New query"
--   3. Colar este ficheiro inteiro e carregar em "Run"
--
-- IMPORTANTE — quem pode publicar:
--   Qualquer utilizador com sessão iniciada pode publicar e apagar notícias.
--   Por isso, em Authentication → Sign In / Providers, DESLIGUE a opção
--   "Allow new users to sign up". Assim só entram as contas que criar
--   à mão em Authentication → Users.
-- =====================================================================

-- 1. Tabela das notícias (os nomes das colunas seguem o modelo do design)
create table if not exists public.noticias (
  id          uuid primary key default gen_random_uuid(),
  date        date not null default current_date,   -- data da notícia
  title       text not null check (char_length(title) between 1 and 120),
  author      text not null,
  short       text not null check (char_length(short) between 1 and 200),
  body        text not null,                         -- parágrafos separados por linha em branco
  photos      jsonb not null default '[]'::jsonb,    -- lista de endereços; o primeiro é a capa
  video       jsonb,                                 -- null | {type:"youtube",id,poster} | {type:"file",src,poster}
  created_at  timestamptz not null default now()
);

alter table public.noticias enable row level security;

drop policy if exists "noticias: leitura publica" on public.noticias;
create policy "noticias: leitura publica" on public.noticias
  for select to anon, authenticated using (true);

drop policy if exists "noticias: escrita autenticada" on public.noticias;
create policy "noticias: escrita autenticada" on public.noticias
  for all to authenticated using (true) with check (true);

-- 2. Pasta pública para as fotografias e vídeos das notícias
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('noticias', 'noticias', true, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "noticias: enviar ficheiros" on storage.objects;
create policy "noticias: enviar ficheiros" on storage.objects
  for insert to authenticated with check (bucket_id = 'noticias');

drop policy if exists "noticias: apagar ficheiros" on storage.objects;
create policy "noticias: apagar ficheiros" on storage.objects
  for delete to authenticated using (bucket_id = 'noticias');
