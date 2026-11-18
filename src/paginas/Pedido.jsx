// Página "Consultar pedido": o cidadão vê o estado e a resposta com o número que recebeu.
// A consulta só devolve estado, assunto e resposta — nunca dados pessoais (ver supabase/instalar.sql).
import { useEffect, useState } from 'react';
import { consultarPedido } from '../api.js';

const quando = (iso) => (iso ? new Date(iso).toLocaleString('pt-PT', { dateStyle: 'long', timeStyle: 'short' }) : '');
const CLASSES = { 'Em análise': 'estado--analise', Respondido: 'estado--respondido', Encerrado: 'estado--encerrado' };

export default function Pedido() {
  const [codigo, setCodigo] = useState(() => new URLSearchParams(location.search).get('n') || '');
  const [estado, setEstado] = useState('inicio'); // inicio | a-procurar | encontrado | nao-existe | erro
  const [pedido, setPedido] = useState(null);

  async function procurar(ev) {
    ev?.preventDefault();
    const limpo = codigo.trim().toUpperCase();
    if (limpo.length < 6) { setEstado('nao-existe'); return; }
    setEstado('a-procurar');
    try {
      const p = await consultarPedido(limpo);
      setPedido(p);
      setEstado(p ? 'encontrado' : 'nao-existe');
    } catch (e) {
      console.error('Consulta:', e);
      setEstado('erro');
    }
  }

  // Chegou aqui com o número no endereço (ligação dada no fim do envio): procura logo.
  useEffect(() => { if (codigo) procurar(); }, []);

  return (
    <main id="conteudo">
      <section className="hero hero--simples">
        <div className="container hero__dentro">
          <div className="hero__texto">
            <p className="eyebrow">Atendimento ao cidadão</p>
            <h1 className="h1">Consultar pedido</h1>
            <p className="lead" style={{ marginBottom: 0 }}>Escreva o número que recebeu no fim do envio do seu pedido para ver o estado e a resposta da EPASB-EP.</p>
          </div>
        </div>
      </section>

      <section className="container seccao">
        <div className="admin__colunas">
          <form className="form" onSubmit={procurar} noValidate style={{ maxWidth: 560 }}>
            <div className="campo">
              <label htmlFor="codigo">Número do pedido</label>
              <input className="input" id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex.: K7Q4-M2XD" autoComplete="off" autoCapitalize="characters" spellCheck="false" style={{ textTransform: 'uppercase' }} />
            </div>
            <div className="form__accoes" style={{ paddingTop: 0, borderTop: 0 }}>
              <button className="btn btn--primario" type="submit" disabled={estado === 'a-procurar'}>{estado === 'a-procurar' ? 'A procurar…' : 'Consultar'}</button>
            </div>

            <div aria-live="polite">
              {estado === 'nao-existe' && <p className="mensagem mensagem--erro">Não encontrámos nenhum pedido com esse número. Confirme se está bem escrito.</p>}
              {estado === 'erro' && <p className="mensagem mensagem--erro">Não foi possível consultar agora. Verifique a sua ligação e tente de novo.</p>}
              {estado === 'encontrado' && (
                <div className="pedido-resultado">
                  <div className="modal__topo">
                    <span className="codigo-pedido">{pedido.codigo}</span>
                    <span className={`estado ${CLASSES[pedido.status] || ''}`}>{pedido.status || 'Novo'}</span>
                  </div>
                  <dl className="detalhes">
                    <div><dt>Assunto</dt><dd>{pedido.assunto}</dd></div>
                    <div><dt>Enviado em</dt><dd>{quando(pedido.criado)}</dd></div>
                    <div className="largo"><dt>Resposta da EPASB-EP</dt><dd>{pedido.resposta || 'Ainda não há resposta. Volte a consultar mais tarde.'}</dd></div>
                    {pedido.atualizado && <div className="largo"><dt>Última actualização</dt><dd>{quando(pedido.atualizado)}</dd></div>}
                  </dl>
                </div>
              )}
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
