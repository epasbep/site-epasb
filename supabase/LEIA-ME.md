# EPASB-EP — configuração do Supabase e da publicação

Passos a fazer uma vez, por quem gere o projecto no Supabase e no GitHub.

## 1. Base de dados (obrigatório)

1. Abrir https://supabase.com/dashboard e o projecto da EPASB.
2. **SQL Editor → New query**, colar o conteúdo de `supabase/instalar.sql` e carregar em **Run**.

Isto cria ou actualiza:

- a tabela **noticias**, já com as 8 notícias do site (passam a poder ser editadas no painel);
- a pasta **noticias** para as fotografias e vídeos;
- a tabela **avisos** (faixa no topo do site);
- o **número de pedido** nos atendimentos e a consulta pelo cidadão (página `pedido.html`).

Pode ser corrido mais do que uma vez sem estragar nada.

## 2. Quem pode entrar no painel (obrigatório)

- **Authentication → Sign In / Providers**: desligar **"Allow new users to sign up"**.
  Sem isto, qualquer pessoa pode criar uma conta e publicar ou apagar notícias.
- **Authentication → Users → Add user**: criar as contas da equipa (marcar "Auto Confirm User").

## 3. Email quando chega um pedido de atendimento (opcional)

Precisa de uma conta no serviço de email **Resend** (https://resend.com), com o domínio `epasb.ao` verificado.

1. Instalar a função: no computador, com a [CLI do Supabase](https://supabase.com/docs/guides/cli):
   ```
   supabase functions deploy aviso-atendimento --project-ref yctyaycgxbbwnzgrkfwq --no-verify-jwt
   ```
2. **Edge Functions → Secrets**, criar:
   - `RESEND_API_KEY` — chave da conta Resend
   - `AVISO_PARA` — email(s) que recebem o aviso, separados por vírgula
   - `AVISO_DE` — remetente, por exemplo `Site EPASB <site@epasb.ao>`
   - `WEBHOOK_SEGREDO` — um texto secreto à escolha
3. **Database → Webhooks → Create a new hook**: tabela `atendimentos`, evento `Insert`,
   tipo "Supabase Edge Functions", função `aviso-atendimento`, e um cabeçalho `x-segredo`
   com o mesmo texto do `WEBHOOK_SEGREDO`.

## 4. Publicação automática no epasb.ao (opcional)

O GitHub já publica o site em https://epasbep.github.io/site-epasb/ a cada alteração.
Para publicar também no alojamento do `epasb.ao`, criar no GitHub
(**Settings → Secrets and variables → Actions → New repository secret**):

- `FTP_SERVIDOR` — servidor FTP do cPanel (por exemplo `ftp.epasb.ao`)
- `FTP_UTILIZADOR` — utilizador FTP (criado no cPanel em "Contas FTP")
- `FTP_PALAVRA_PASSE` — palavra-passe desse utilizador
- `FTP_PASTA` (opcional) — pasta de destino; por omissão `public_html/`

Antes da primeira publicação, guardar uma cópia do `public_html` actual (sobretudo o `.htaccess`).
A partir daí, cada alteração no `main` actualiza o `epasb.ao` sozinha.
A publicação também corre de hora a hora, para criar as páginas de partilha das notícias novas.
