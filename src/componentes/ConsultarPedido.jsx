// Caixa "Consultar pedido" na página de Atendimento: o cidadão vê o estado e a resposta com o número que recebeu.
// A consulta só devolve estado, assunto e resposta — nunca dados pessoais (ver supabase/instalar.sql).
import { useEffect, useState } from 'react';
import { consultarPedido } from '../api.js';

const quando = (iso) => (iso ? new Date(iso).toLocaleString('pt-PT', { dateStyle: 'medium', timeStyle: 'short' }) : '');
const CLASSES = { 'Em análise': 'estado--analise', Respondido: 'estado--respondido', Encerrado: 'estado--encerrado' };

// pedirConsulta: número enviado de fora (ex.: logo depois de enviar o formulário), com um contador para repetir.
export function ConsultarPedido({ pedirConsulta }) {
  const [codigo, setCodigo] = useState(() => new URLSearchParams(location.search).get('n') || '');
  const [estado, setEstado] = useState('inicio'); // inicio | a-procurar | encontrado | nao-existe | erro
  const [pedido, setPedido] = useState(null);

  async function procurar(valor) {
    const limpo = String(valor).trim().toUpperCase();
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

  // Com o número no endereço (?n=…), procura logo.
  useEffect(() => { if (codigo) procurar(codigo); }, []);
  useEffect(() => {
    if (!pedirConsulta?.codigo) return;
    setCodigo(pedirConsulta.codigo);
    procurar(pedirConsulta.codigo);
  }, [pedirConsulta]);

  return (
    <div className="caixa consulta" id="consultar">
      <h2 className="h3">Consultar pedido</h2>
      <p className="campo__ajuda">Escreva o número que recebeu no fim do envio.</p>
      <form className="consulta__linha" onSubmit={(ev) => { ev.preventDefault(); procurar(codigo); }} noValidate>
        <label className="sr" htmlFor="codigo">Número do pedido</label>
        <input className="input" id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)}
          placeholder="Ex.: K7Q4-M2XD" autoComplete="off" autoCapitalize="characters" spellCheck="false" />
        <button className="btn btn--primario" type="submit" disabled={estado === 'a-procurar'}>{estado === 'a-procurar' ? '…' : 'Consultar'}</button>
      </form>
      <div aria-live="polite">
        {estado === 'nao-existe' && <p className="consulta__erro">Não encontrámos nenhum pedido com esse número.</p>}
        {estado === 'erro' && <p className="consulta__erro">Não foi possível consultar agora. Tente de novo.</p>}
        {estado === 'encontrado' && (
          <div className="consulta__resultado">
            <div className="consulta__topo">
              <strong>{pedido.codigo}</strong>
              <span className={`estado ${CLASSES[pedido.status] || ''}`}>{pedido.status || 'Novo'}</span>
            </div>
            <p className="consulta__meta">{pedido.assunto} · enviado a {quando(pedido.criado)}</p>
            <p className="consulta__resposta">{pedido.resposta || 'Ainda não há resposta. Volte a consultar mais tarde.'}</p>
            {pedido.atualizado && <p className="consulta__meta">Actualizado a {quando(pedido.atualizado)}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// Versão curta para a página inicial: leva para a caixa da página de Atendimento, já com o número.
export function ConsultaRapida() {
  const [codigo, setCodigo] = useState('');
  const ir = (ev) => {
    ev.preventDefault();
    const limpo = codigo.trim().toUpperCase();
    location.href = `contacto${limpo ? `?n=${encodeURIComponent(limpo)}` : ''}#consultar`;
  };
  return (
    <form className="consulta-rapida" onSubmit={ir} noValidate>
      <label htmlFor="codigo-rapido">Já fez um pedido? Veja o estado:</label>
      <div className="consulta__linha">
        <input className="input" id="codigo-rapido" value={codigo} onChange={(e) => setCodigo(e.target.value)}
          placeholder="Número do pedido" autoComplete="off" autoCapitalize="characters" spellCheck="false" />
        <button className="btn btn--secundario" type="submit">Consultar</button>
      </div>
    </form>
  );
}
