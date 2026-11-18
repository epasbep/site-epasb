// EPASB-EP — envia um email à equipa sempre que chega um novo pedido de atendimento.
//
// Funciona com um "Database Webhook" do Supabase (tabela atendimentos, evento INSERT)
// e com o serviço de email Resend (https://resend.com). Instruções em supabase/LEIA-ME.md.
//
// Variáveis a definir no Supabase (Edge Functions → Secrets):
//   RESEND_API_KEY   chave da conta Resend
//   AVISO_PARA       email(s) que recebem o aviso, separados por vírgula
//   AVISO_DE         remetente verificado no Resend, ex.: "Site EPASB <site@epasb.ao>"
//   WEBHOOK_SEGREDO  texto secreto que o webhook envia no cabeçalho "x-segredo"

Deno.serve(async (req) => {
  const segredo = Deno.env.get('WEBHOOK_SEGREDO');
  if (!segredo || req.headers.get('x-segredo') !== segredo) {
    return new Response('Não autorizado', { status: 401 });
  }

  const { type, table, record } = await req.json().catch(() => ({}));
  if (type !== 'INSERT' || table !== 'atendimentos' || !record) {
    return new Response('Ignorado', { status: 200 });
  }

  const linhas = [
    `Chegou um novo pedido de atendimento ao site da EPASB-EP.`,
    ``,
    `Número:   ${record.codigo ?? '-'}`,
    `Assunto:  ${record.assunto ?? '-'}`,
    `Nome:     ${record.nome ?? '-'}`,
    `Email:    ${record.email ?? '-'}`,
    `Telefone: ${record.telefone ?? '-'}`,
    `Anexo:    ${record.documento_url ? 'sim' : 'não'}`,
    ``,
    `Mensagem:`,
    `${record.mensagem ?? ''}`,
    ``,
    `Responder no painel: https://www.epasb.ao/admin/`
  ];

  const resposta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('AVISO_DE'),
      to: (Deno.env.get('AVISO_PARA') ?? '').split(',').map((e) => e.trim()).filter(Boolean),
      reply_to: record.email || undefined,
      subject: `Novo atendimento: ${record.assunto ?? 'sem assunto'}${record.codigo ? ` (${record.codigo})` : ''}`,
      text: linhas.join('\n')
    })
  });

  if (!resposta.ok) {
    console.error('Resend:', resposta.status, await resposta.text());
    return new Response('Falhou o envio do email', { status: 502 });
  }
  return new Response('Enviado', { status: 200 });
});
