-- =====================================================================
-- EPASB-EP — instalação da base de dados (Supabase)
--
-- COMO USAR:
--   1. Abrir o projecto em https://supabase.com/dashboard
--   2. Menu "SQL Editor" → "New query"
--   3. Colar este ficheiro inteiro e carregar em "Run"
--
-- Pode ser corrido mais do que uma vez: não apaga nem duplica dados.
-- Ver também supabase/LEIA-ME.md (passos que não se fazem por SQL).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. NOTÍCIAS
-- ---------------------------------------------------------------------
create table if not exists public.noticias (
  id          text primary key default gen_random_uuid()::text,
  date        date default current_date,                 -- data da notícia (pode ficar vazia)
  title       text not null check (char_length(title) between 1 and 120),
  author      text not null,
  short       text not null check (char_length(short) between 1 and 200),
  body        text not null,                             -- parágrafos separados por linha em branco
  photos      jsonb not null default '[]'::jsonb,        -- endereços; o primeiro é a capa
  video       jsonb,                                     -- null | {type:"youtube",id,poster} | {type:"file",src,poster}
  source      text,                                      -- ligação para a publicação original (opcional)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

-- Ajustes para quem correu a versão anterior deste ficheiro (noticias.sql)
alter table public.noticias alter column id type text using id::text;
alter table public.noticias alter column id set default gen_random_uuid()::text;
alter table public.noticias alter column date drop not null;
alter table public.noticias add column if not exists source text;
alter table public.noticias add column if not exists updated_at timestamptz;

alter table public.noticias enable row level security;

drop policy if exists "noticias: leitura publica" on public.noticias;
create policy "noticias: leitura publica" on public.noticias
  for select to anon, authenticated using (true);

drop policy if exists "noticias: escrita autenticada" on public.noticias;
create policy "noticias: escrita autenticada" on public.noticias
  for all to authenticated using (true) with check (true);

-- Notícias que já estavam no site (passam a poder ser editadas no painel)
insert into public.noticias (id, date, title, author, short, body, photos, video, source) values
  ('campanha-bairro-da-luz', '2026-08-26', 'EPASB-EP realiza campanha de mobilização social no Bairro da Luz', 'EPASB-EP', 'A EPASB-EP esteve junto dos moradores do Bairro da Luz para estreitar a relação com os clientes, ouvir as suas preocupações e apresentar novas soluções.', 'A EPASB-EP realizou uma campanha de mobilização social junto dos moradores do Bairro da Luz, com o objectivo de estreitar a relação com os clientes, ouvir as suas preocupações e apresentar novas soluções.

Entre as novidades apresentadas estão a Cobrança Móvel e a Instalação de Contadores Pré-Pagos, soluções que procuram tornar o acesso aos serviços mais simples e próximo.

A iniciativa reforça o compromisso da EPASB-EP com um serviço mais próximo dos cidadãos e com a sustentabilidade do abastecimento de água.', '["assets/img/noticias/bairro-luz-1600.webp"]'::jsonb, null, 'https://www.facebook.com/share/p/19G1bNdJav/'),
  ('contadores-pre-pagos-imprensa', '2026-08-25', 'EPASB-EP apresenta Projecto de Instalação de Contadores Pré-Pagos à Imprensa', 'EPASB-EP', 'O projecto foi apresentado aos Órgãos de Comunicação Social e aos Gabinetes de Comunicação Social das Administrações Municipais.', 'A EPASB-EP apresentou aos Órgãos de Comunicação Social e aos Gabinetes de Comunicação Social das Administrações Municipais o Projecto de Instalação de Contadores Pré-Pagos.

O projecto prevê a modernização do sistema de medição e gestão do consumo de água, contribuindo para uma maior autonomia dos clientes.

Os primeiros contadores pré-pagos serão instalados no dia 7 de Setembro, na Restinga do Lobito.', '["assets/img/noticias/contadores-pre-pagos-1600.webp"]'::jsonb, null, 'https://www.facebook.com/share/p/1DKZuz7yHv/'),
  ('programa-contadores-lobito', '2026-08-24', 'Lobito dá início ao Programa de Instalação de Contadores Pré-Pagos', 'EPASB-EP', 'O Município do Lobito é o ponto de partida do programa, com a fase-piloto prevista para a Restinga.', 'O Município do Lobito será o ponto de partida do Programa de Instalação de Contadores Pré-Pagos da EPASB-EP, com a fase-piloto prevista para a Restinga.

A iniciativa será estendida aos municípios de Benguela, Catumbela, Navegantes e Baía Farta, ao longo de sete meses.

O acto de apresentação pública reuniu autoridades municipais, membros do Conselho de Administração da EPASB-EP, autoridades tradicionais, entidades religiosas, comissões de moradores, representantes da sociedade civil e a ACQUA.', '["assets/img/noticias/programa-lobito-1600.webp"]'::jsonb, null, 'https://www.facebook.com/share/p/1Bw57vwnjB/'),
  ('colonia-de-ferias-3-edicao', '2026-08-19', '3.ª Edição da Colónia de Férias chega à EPASB-EP', 'EPASB-EP', 'Mais de 120 crianças, dos 5 aos 17 anos, visitaram a EPASB-EP no âmbito da 3.ª edição da Colónia de Férias, dedicada ao tema «Ambiente».', 'Mais de 120 crianças, dos 5 aos 17 anos, visitaram a EPASB-EP no âmbito da 3.ª edição da Colónia de Férias, dedicada ao tema «Ambiente».

Os participantes visitaram o Rio Catumbela, a Estação de Bombagem de Água Bruta e o sistema integrado da Estação de Tratamento de Água do Luongo.', '["assets/img/noticias/colonia-ferias-1600.webp"]'::jsonb, null, 'https://www.facebook.com/epasbep'),
  ('expansao-da-rede', null, 'Expansão da Rede de Abastecimento de Água', 'EPASB-EP', 'A EPASB-EP desenvolve novos projectos para ampliar o acesso à água potável nas comunidades da província de Benguela.', 'A EPASB-EP desenvolve novos projectos para ampliar o acesso à água potável nas comunidades da província de Benguela.

As iniciativas fazem parte dos esforços para melhorar a cobertura e a qualidade dos serviços de abastecimento de água.', '["assets/img/noticias/rede-1600.webp"]'::jsonb, null, 'https://www.facebook.com/epasbep'),
  ('obras-em-novos-municipios', null, 'Obras em Novos Municípios', 'EPASB-EP', 'Novas intervenções técnicas estão em andamento para melhorar a distribuição de água e fortalecer os serviços públicos.', 'Novas intervenções técnicas estão em andamento para melhorar a distribuição de água e fortalecer os serviços públicos.

A EPASB-EP continua a acompanhar e desenvolver acções destinadas a melhorar as infra-estruturas de abastecimento na província.', '["assets/img/noticias/obras-1600.webp"]'::jsonb, null, 'https://www.facebook.com/epasbep'),
  ('informacoes-oficiais', null, 'Informações Oficiais da EPASB-EP', 'EPASB-EP', 'Consulte avisos, comunicados e informações importantes divulgados pela EPASB-EP para os cidadãos.', 'Consulte avisos, comunicados e informações importantes divulgados pela EPASB-EP para os cidadãos.

Acompanhe as informações oficiais através dos canais institucionais da Empresa.', '["assets/img/noticias/comunicado-1600.webp"]'::jsonb, null, 'https://www.facebook.com/epasbep'),
  ('campanhas-de-sensibilizacao', null, 'Campanhas de Sensibilização', 'EPASB-EP', 'A EPASB promove acções de sensibilização sobre o uso responsável da água e a protecção ambiental.', 'A EPASB promove acções de sensibilização sobre o uso responsável da água e a protecção ambiental.

As campanhas procuram aproximar a Empresa das comunidades e incentivar práticas responsáveis na utilização dos recursos hídricos.', '["assets/img/noticias/campanha-1600.webp"]'::jsonb, null, 'https://www.facebook.com/epasbep')
on conflict (id) do nothing;

-- Pasta pública para as fotografias e vídeos das notícias
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


-- ---------------------------------------------------------------------
-- 2. AVISOS (faixa no topo do site: interrupções, avisos urgentes)
-- ---------------------------------------------------------------------
create table if not exists public.avisos (
  id          bigint generated always as identity primary key,
  texto       text not null check (char_length(texto) between 1 and 220),
  tipo        text not null default 'informacao' check (tipo in ('informacao', 'urgente')),
  link        text,                                      -- página com mais informação (opcional)
  fim         timestamptz,                               -- deixa de aparecer a partir desta data (opcional)
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.avisos enable row level security;

drop policy if exists "avisos: leitura publica" on public.avisos;
create policy "avisos: leitura publica" on public.avisos
  for select to anon using (activo and (fim is null or fim > now()));

drop policy if exists "avisos: gestao autenticada" on public.avisos;
create policy "avisos: gestao autenticada" on public.avisos
  for all to authenticated using (true) with check (true);


-- ---------------------------------------------------------------------
-- 3. ATENDIMENTOS — número de pedido e consulta pelo cidadão
-- ---------------------------------------------------------------------
-- O número (ex.: K7Q4-M2XD) é gerado no site e mostrado ao cidadão no fim do envio.
alter table public.atendimentos add column if not exists codigo text;
alter table public.atendimentos add column if not exists atualizado_at timestamptz;
create unique index if not exists atendimentos_codigo_unico on public.atendimentos (codigo);

-- O cidadão consulta o estado e a resposta com o número. Só devolve esse pedido,
-- e só estes campos — nunca o nome, email, telefone ou mensagem.
create or replace function public.consultar_pedido(p_codigo text)
returns table (codigo text, assunto text, status text, resposta text, criado timestamptz, atualizado timestamptz)
language sql
security definer
set search_path = public
as $$
  select a.codigo, a.assunto, a.status, a.resposta, a.created_at, a.atualizado_at
  from public.atendimentos a
  where p_codigo is not null
    and char_length(p_codigo) between 6 and 20
    and a.codigo = upper(trim(p_codigo))
  limit 1;
$$;

revoke all on function public.consultar_pedido(text) from public;
grant execute on function public.consultar_pedido(text) to anon, authenticated;
