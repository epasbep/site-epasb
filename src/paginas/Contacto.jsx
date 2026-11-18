// Página "Contacto": formulário de atendimento ao cidadão.
// Os pedidos são guardados na tabela "atendimentos" do Supabase (e o anexo no bucket "atendimentos").
import { useRef, useState } from 'react';
import { sb } from '../supabase.js';
import { TELEFONE, EMAILS, MORADA } from '../config.js';

const MAX = 5 * 1024 * 1024;
const TIPOS = ['application/pdf', 'image/jpeg', 'image/png'];
const VAZIO = { nome: '', email: '', telefone: '', assunto: '', mensagem: '' };

// Número do pedido que o cidadão guarda para consultar o estado (ex.: K7Q4-M2XD).
// Sem letras/números que se confundem (0/O, 1/I).
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function novoCodigo() {
  const v = crypto.getRandomValues(new Uint8Array(8));
  const c = Array.from(v, (n) => LETRAS[n % LETRAS.length]).join('');
  return `${c.slice(0, 4)}-${c.slice(4)}`;
}

function erroDocumento(f) {
  if (!f) return '';
  if (f.size > MAX) return 'O documento ultrapassa o limite de 5 MB.';
  if (!TIPOS.includes(f.type)) return 'Tipo de documento não permitido. Envie apenas PDF, JPG ou PNG.';
  return '';
}

function Campo({ nome, rotulo, erro, children }) {
  return (
    <div className={`campo${erro ? ' campo--erro' : ''}`}>
      <label htmlFor={nome}>{rotulo}</label>
      {children}
      <p className="campo__erro">{erro}</p>
    </div>
  );
}

export default function Contacto() {
  const [dados, setDados] = useState(VAZIO);
  const [doc, setDoc] = useState(null);
  const [erros, setErros] = useState({});
  const [aEnviar, setAEnviar] = useState(false);
  const [resultado, setResultado] = useState(null); // { tipo: 'sucesso' | 'erro', texto, codigo? }
  const [aceita, setAceita] = useState(false);
  const form = useRef(null);
  const ficheiro = useRef(null);

  // O erro de um campo desaparece quando a pessoa o corrige.
  const mudar = (e) => {
    const { name, value } = e.target;
    setDados((d) => ({ ...d, [name]: value }));
    setErros((x) => ({ ...x, [name]: '' }));
  };
  const escolherDoc = (e) => {
    const f = e.target.files[0] || null;
    setDoc(f);
    setErros((x) => ({ ...x, documento: erroDocumento(f) }));
  };

  async function enviar(ev) {
    ev.preventDefault();
    setResultado(null);
    const d = Object.fromEntries(Object.entries(dados).map(([k, v]) => [k, v.trim()]));
    const novos = {
      nome: d.nome ? '' : 'Indique o seu nome.',
      email: /^\S+@\S+\.\S+$/.test(d.email) ? '' : 'Indique um email válido.',
      assunto: d.assunto ? '' : 'Seleccione o assunto.',
      mensagem: d.mensagem ? '' : 'Escreva a sua mensagem.',
      documento: erroDocumento(doc),
      aceita: aceita ? '' : 'Para enviar, confirme que leu a informação sobre os seus dados.'
    };
    setErros(novos);
    const primeiro = Object.keys(novos).find((k) => novos[k]);
    if (primeiro) { form.current.elements[primeiro]?.focus(); return; }

    setAEnviar(true);
    let caminho = null;
    try {
      if (doc) {
        const limpo = doc.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
        caminho = `documentos/${Date.now()}_${limpo}`;
        const { error } = await sb.storage.from('atendimentos').upload(caminho, doc, { cacheControl: '3600', upsert: false, contentType: doc.type });
        if (error) throw error;
      }
      const registo = {
        nome: d.nome, email: d.email, telefone: d.telefone || null, assunto: d.assunto,
        mensagem: d.mensagem, status: 'Novo', resposta: null, documento_url: caminho
      };
      let codigo = novoCodigo();
      let { error } = await sb.from('atendimentos').insert({ ...registo, codigo });
      if (error?.code === '23505') { // número repetido (muito raro): tenta outro
        codigo = novoCodigo();
        ({ error } = await sb.from('atendimentos').insert({ ...registo, codigo }));
      }
      if (error && /codigo/i.test(error.message || '')) { // base de dados ainda sem a coluna "codigo"
        codigo = null;
        ({ error } = await sb.from('atendimentos').insert(registo));
      }
      if (error) {
        if (caminho) await sb.storage.from('atendimentos').remove([caminho]);
        throw error;
      }
      setDados(VAZIO);
      setDoc(null);
      setAceita(false);
      ficheiro.current.value = '';
      setResultado({ tipo: 'sucesso', texto: 'Atendimento enviado com sucesso. A EPASB-EP recebeu a sua solicitação.', codigo });
    } catch (e) {
      console.error('Atendimento:', e);
      setResultado({ tipo: 'erro', texto: 'Não foi possível enviar. Verifique a sua ligação e tente novamente, ou contacte-nos por telefone ou WhatsApp.' });
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <main id="conteudo">
      <section className="hero hero--simples">
        <div className="container hero__dentro">
          <div className="hero__texto">
            <p className="eyebrow">Atendimento ao cidadão</p>
            <h1 className="h1">Fale connosco</h1>
            <p className="lead" style={{ marginBottom: 0 }}>Para formalizar uma solicitação, um esclarecimento, uma denúncia ou uma sugestão, preencha o formulário. Se for urgente, ligue ou escreva pelo WhatsApp.</p>
          </div>
        </div>
      </section>

      <section className="container seccao">
        <div className="admin__colunas">
          <form className="form" ref={form} onSubmit={enviar} noValidate>
            <Campo nome="nome" rotulo="Nome *" erro={erros.nome}>
              <input className="input" id="nome" name="nome" autoComplete="name" value={dados.nome} onChange={mudar} />
            </Campo>
            <Campo nome="email" rotulo="Email *" erro={erros.email}>
              <input className="input" id="email" name="email" type="email" autoComplete="email" inputMode="email" value={dados.email} onChange={mudar} />
            </Campo>
            <Campo nome="telefone" rotulo="Telefone">
              <input className="input" id="telefone" name="telefone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+244 9XX XXX XXX" value={dados.telefone} onChange={mudar} />
            </Campo>
            <Campo nome="assunto" rotulo="Assunto *" erro={erros.assunto}>
              <select className="select" id="assunto" name="assunto" value={dados.assunto} onChange={mudar}>
                <option value="">Seleccione um assunto</option>
                <option>Elogio</option><option>Solicitação</option><option>Denúncia</option><option>Sugestão</option>
              </select>
            </Campo>
            <Campo nome="mensagem" rotulo="Mensagem *" erro={erros.mensagem}>
              <textarea className="textarea" id="mensagem" name="mensagem" rows="6" value={dados.mensagem} onChange={mudar} />
            </Campo>
            <div className={`campo${erros.documento ? ' campo--erro' : ''}`}>
              <span className="campo__label" id="l-doc">Anexar documento (opcional)</span>
              <p className="campo__ajuda">PDF, JPG ou PNG, até 5 MB.</p>
              <label className="ficheiro">
                <span>{doc ? `${doc.name} (${(doc.size / 1024 / 1024).toFixed(2)} MB)` : 'Escolher ficheiro'}</span>
                <input className="sr" name="documento" type="file" ref={ficheiro} onChange={escolherDoc}
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" aria-labelledby="l-doc" />
              </label>
              <p className="campo__erro">{erros.documento}</p>
            </div>
            <div className={`campo${erros.aceita ? ' campo--erro' : ''}`}>
              <p className="nota-privacidade">
                Os dados deste formulário servem apenas para a EPASB-EP tratar e responder ao seu pedido. São guardados de forma
                segura, só a equipa de atendimento lhes tem acesso e não são partilhados com terceiros, nos termos da
                Lei n.º 22/11, de 17 de Junho (Lei da Protecção de Dados Pessoais). Pode pedir a consulta ou a eliminação
                dos seus dados através de <a href="mailto:geral@epasb.ao">geral@epasb.ao</a>.
              </p>
              <label className="consentimento" style={{ marginTop: 12 }}>
                <input type="checkbox" name="aceita" checked={aceita} onChange={(e) => { setAceita(e.target.checked); setErros((x) => ({ ...x, aceita: '' })); }} />
                <span>Li e aceito que os meus dados sejam usados para tratar este pedido. *</span>
              </label>
              <p className="campo__erro">{erros.aceita}</p>
            </div>
            <div className={`mensagem${resultado ? ` mensagem--${resultado.tipo}` : ''}`} role="status">
              {resultado?.texto}
              {resultado?.codigo && (
                <div className="pedido-resultado" style={{ marginTop: 12, fontWeight: 400, color: 'var(--texto)' }}>
                  <span>Número do seu pedido (guarde-o):</span>
                  <span className="codigo-pedido">{resultado.codigo}</span>
                  <a href={`pedido.html?n=${encodeURIComponent(resultado.codigo)}`}>Consultar o estado do pedido →</a>
                </div>
              )}
            </div>
            <div className="form__accoes">
              <button className="btn btn--primario" type="submit" disabled={aEnviar}>{aEnviar ? 'A enviar…' : 'Enviar solicitação'}</button>
            </div>
          </form>

          <aside className="admin__previa" aria-labelledby="t-cont">
            <div className="caixa">
              <h2 className="h3" id="t-cont">Outros contactos</h2>
              <dl className="contactos">
                <dt>Telefone</dt><dd><a href={`tel:${TELEFONE.ligar}`}>{TELEFONE.visivel}</a></dd>
                <dt>WhatsApp</dt><dd><a href={`https://wa.me/${TELEFONE.whatsapp}`} target="_blank" rel="noopener noreferrer">Enviar mensagem</a></dd>
                <dt>Email</dt><dd>{EMAILS.map((e) => <div key={e}><a href={`mailto:${e}`}>{e}</a></div>)}</dd>
                <dt>Morada</dt><dd>{MORADA}</dd>
              </dl>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
