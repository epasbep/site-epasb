# EPASB-EP — configuração do Supabase e da publicação

Passos a fazer uma vez, por quem gere o projecto no Supabase e no GitHub.

## 1. Base de dados (obrigatório)

No Supabase (https://supabase.com/dashboard), **SQL Editor → New query**, e correr por esta ordem:

1. `supabase/instalar.sql` — notícias, avisos e número de pedido nos atendimentos.
2. `supabase/fase1-papeis.sql` — papéis de acesso, aprovação de notícias, auditoria e protecção contra envios em massa.
   **Antes de correr**, escreva o seu email na linha marcada com `<<<`: essa conta passa a ser **Super Administrador**.

Os dois podem ser corridos mais do que uma vez sem estragar nada.

> Depois do passo 2, as outras contas que já existiam ficam **sem acesso** ao painel até o
> Super Administrador lhes dar um papel em **Painel → Utilizadores** (precisa do passo 3).

## 2. Registo de contas (obrigatório)

- **Authentication → Sign In / Providers**: **"Allow new users to sign up"** tem de estar **desligado**.
  As contas criam-se só no painel (Utilizadores) ou em Authentication → Users.

## 3. Gestão de utilizadores no painel (obrigatório para a página Utilizadores)

Criar e apagar contas exige uma função que corre no servidor do Supabase.

1. **Edge Functions → Deploy a new function → Via Editor**.
2. Nome: **`gerir-utilizadores`**.
3. Apagar o código de exemplo, colar o conteúdo de `supabase/functions/gerir-utilizadores/index.ts` e **Deploy**.
4. Deixar **Enforce JWT Verification ligado** (a função só aceita pedidos de quem tem sessão iniciada).

Não precisa de segredos: o Supabase dá-lhe automaticamente o endereço e a chave de serviço.

### Papéis

| Papel | Pode |
|---|---|
| **Super Administrador** | Tudo: utilizadores e papéis, auditoria, notícias, avisos, atendimentos (incluindo apagar). |
| **Gestor** | Notícias e avisos; aprova ou devolve as notícias dos Editores; relatório de atendimento **só com números**. |
| **Editor** | Escreve e edita as suas notícias e envia-as para revisão; não publica. |
| **Atendimento** | Pedidos dos cidadãos: ver, responder e mudar o estado. Não mexe em conteúdos. |

Estas regras estão na base de dados: mesmo que alguém force um pedido fora do painel, o Supabase recusa-o.

## 4. Email quando chega um pedido de atendimento (opcional)

Precisa de uma conta no serviço de email **Resend** (https://resend.com), com o domínio `epasb.ao`
verificado (o Resend indica os registos a acrescentar no DNS do domínio, na `servidor.ao`).

1. **Edge Functions → Deploy a new function → Via Editor**, nome **`aviso-atendimento`**, colar
   `supabase/functions/aviso-atendimento/index.ts` e **Deploy**.
2. Nas definições da função, **desligar Enforce JWT Verification** (a função protege-se com o `WEBHOOK_SEGREDO`).
3. **Edge Functions → Secrets**, criar:
   - `RESEND_API_KEY` — chave da conta Resend
   - `AVISO_PARA` — email(s) que recebem o aviso, separados por vírgula
   - `AVISO_DE` — remetente, por exemplo `Site EPASB <site@epasb.ao>`
   - `WEBHOOK_SEGREDO` — um texto secreto à escolha
4. **Database → Webhooks → Create a new hook**: tabela `atendimentos`, evento `Insert`,
   tipo "Supabase Edge Functions", função `aviso-atendimento`, e um cabeçalho `x-segredo`
   com o mesmo texto do `WEBHOOK_SEGREDO`.

## 5. Publicação automática no epasb.ao (opcional)

O GitHub já publica o site em https://epasbep.github.io/site-epasb/ a cada alteração.
Para publicar também no alojamento do `epasb.ao`, criar no GitHub
(**Settings → Secrets and variables → Actions → New repository secret**):

- `FTP_SERVIDOR` — servidor FTP do cPanel (por exemplo `ftp.epasb.ao`)
- `FTP_UTILIZADOR` — utilizador FTP (criado no cPanel em "Contas FTP")
- `FTP_PALAVRA_PASSE` — palavra-passe desse utilizador
- `FTP_PASTA` (opcional) — pasta de destino; por omissão `public_html/`

Antes da primeira publicação, guardar uma cópia do `public_html` actual (sobretudo o `.htaccess`).

## 6. Cópia de segurança diária (enquanto o plano for o gratuito)

O workflow `.github/workflows/copia-seguranca.yml` copia a base de dados todos os dias, **encripta** a cópia
e guarda-a 30 dias no GitHub (Actions → Cópia de segurança → execução → Artifacts). O repositório é
público: por isso a cópia nunca sai sem encriptação.

Criar no GitHub (Settings → Secrets and variables → Actions):

- `SUPABASE_DB_URL` — no Supabase, botão **Connect** → **Session pooler** → copiar a ligação (URI)
  e substituir `[YOUR-PASSWORD]` pela palavra-passe da base de dados.
- `COPIA_PALAVRA_PASSE` — uma palavra-passe longa só para as cópias. **Guarde-a também fora do GitHub**:
  sem ela não é possível abrir as cópias.

Para abrir uma cópia: descarregar o ficheiro `.dump.gpg` e correr
`gpg --decrypt epasb-AAAA-MM-DD.dump.gpg > copia.dump`; restaura-se com `pg_restore`.

Notas:
- As fotografias e os documentos anexados (Storage) **não** entram nesta cópia.
- Quando passarem ao plano pago, o Supabase faz cópias automáticas e este workflow pode ser desligado
  (Actions → Cópia de segurança → ⋯ → Disable workflow).
