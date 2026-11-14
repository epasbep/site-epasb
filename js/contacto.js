// Formulário de atendimento ao cidadão → tabela "atendimentos" + bucket "atendimentos" do Supabase.
import { SUPABASE_URL, SUPABASE_KEY, TELEFONE, EMAILS, MORADA } from './config.js';

// Outros contactos (vêm de js/config.js)
document.getElementById('contactos').innerHTML = `
  <dt>Telefone</dt><dd><a href="tel:${TELEFONE.ligar}">${TELEFONE.visivel}</a></dd>
  <dt>WhatsApp</dt><dd><a href="https://wa.me/${TELEFONE.whatsapp}" target="_blank" rel="noopener noreferrer">Enviar mensagem</a></dd>
  <dt>Email</dt><dd>${EMAILS.map((e) => `<a href="mailto:${e}">${e}</a>`).join('<br>')}</dd>
  <dt>Morada</dt><dd>${MORADA}</dd>`;

const form = document.getElementById('form-atendimento');
const botao = document.getElementById('enviar');
const resultado = document.getElementById('resultado');
const docInput = document.getElementById('documento');
const docNome = document.getElementById('doc-nome');

const MAX = 5 * 1024 * 1024;
const TIPOS = ['application/pdf', 'image/jpeg', 'image/png'];

const mostrarErro = (campo, texto) => {
  const p = form.querySelector(`[data-erro="${campo}"]`);
  p.textContent = texto || '';
  p.closest('.campo').classList.toggle('campo--erro', !!texto);
};
const mensagem = (texto, tipo) => {
  resultado.textContent = texto;
  resultado.className = 'mensagem' + (tipo ? ` mensagem--${tipo}` : '');
};

function erroDocumento(f) {
  if (!f) return '';
  if (f.size > MAX) return 'O documento ultrapassa o limite de 5 MB.';
  if (!TIPOS.includes(f.type)) return 'Tipo de documento não permitido. Envie apenas PDF, JPG ou PNG.';
  return '';
}

docInput.addEventListener('change', () => {
  const f = docInput.files[0];
  docNome.textContent = f ? `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)` : 'Escolher ficheiro';
  mostrarErro('documento', erroDocumento(f));
});

// O erro de um campo desaparece quando a pessoa o corrige.
form.addEventListener('input', (e) => { if (e.target.name && e.target.name !== 'documento') mostrarErro(e.target.name, ''); });

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  mensagem('');
  const d = Object.fromEntries(['nome', 'email', 'telefone', 'assunto', 'mensagem'].map((k) => [k, form.elements[k].value.trim()]));
  const doc = docInput.files[0] || null;

  const erros = {
    nome: d.nome ? '' : 'Indique o seu nome.',
    email: /^\S+@\S+\.\S+$/.test(d.email) ? '' : 'Indique um email válido.',
    assunto: d.assunto ? '' : 'Seleccione o assunto.',
    mensagem: d.mensagem ? '' : 'Escreva a sua mensagem.',
    documento: erroDocumento(doc)
  };
  Object.entries(erros).forEach(([k, v]) => mostrarErro(k, v));
  const primeiro = Object.keys(erros).find((k) => erros[k]);
  if (primeiro) { form.elements[primeiro].focus(); return; }

  botao.disabled = true;
  botao.textContent = doc ? 'A enviar documento…' : 'A enviar…';
  let caminho = null;
  try {
    if (!window.supabase) throw new Error('sem ligação');
    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    if (doc) {
      const limpo = doc.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
      caminho = `documentos/${Date.now()}_${limpo}`;
      const { error } = await sb.storage.from('atendimentos').upload(caminho, doc, { cacheControl: '3600', upsert: false, contentType: doc.type });
      if (error) throw error;
    }

    const { error } = await sb.from('atendimentos').insert({
      nome: d.nome, email: d.email, telefone: d.telefone || null, assunto: d.assunto,
      mensagem: d.mensagem, status: 'Novo', resposta: null, documento_url: caminho
    });
    if (error) {
      if (caminho) await sb.storage.from('atendimentos').remove([caminho]);
      throw error;
    }

    form.reset();
    docNome.textContent = 'Escolher ficheiro';
    mensagem('Atendimento enviado com sucesso. A EPASB-EP recebeu a sua solicitação.', 'sucesso');
  } catch (e) {
    console.error('Atendimento:', e);
    mensagem('Não foi possível enviar. Verifique a sua ligação e tente novamente, ou contacte-nos por telefone ou WhatsApp.', 'erro');
  } finally {
    botao.disabled = false;
    botao.textContent = 'Enviar solicitação';
    resultado.scrollIntoView({ block: 'nearest' });
  }
});
