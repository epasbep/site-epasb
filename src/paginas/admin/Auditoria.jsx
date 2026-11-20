// Painel administrativo: registo de auditoria (só Super Administrador).
// Mostra quem fez o quê no painel. Dos atendimentos só se registam estado e resposta, nunca dados pessoais.
import { useEffect, useState } from 'react';
import { sb } from '../../supabase.js';
import { Painel, PAPEIS } from '../../componentes/Admin.jsx';

const TABELAS = [['', 'Tudo'], ['noticias', 'Notícias'], ['avisos', 'Avisos'], ['atendimentos', 'Atendimentos'], ['utilizadores', 'Utilizadores']];
const ACCOES = { insert: 'criou', update: 'alterou', delete: 'apagou', criar: 'criou conta', alterar: 'alterou conta', remover: 'removeu conta', 'palavra-passe': 'mudou palavra-passe' };
const quando = (iso) => new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'medium' });

// Resumo legível do que mudou
function resumo(det) {
  if (!det) return '';
  return Object.entries(det).map(([k, v]) => {
    if (v && typeof v === 'object' && 'depois' in v) {
      const curto = (x) => (typeof x === 'string' ? (x.length > 60 ? x.slice(0, 60) + '…' : x) : JSON.stringify(x));
      return `${k}: ${curto(v.antes ?? '—')} → ${curto(v.depois ?? '—')}`;
    }
    return `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`;
  }).join(' · ');
}

function Registo() {
  const [linhas, setLinhas] = useState(null);
  const [tabela, setTabela] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    setLinhas(null);
    let q = sb.from('auditoria').select('*').order('quando', { ascending: false }).limit(300);
    if (tabela) q = q.eq('tabela', tabela);
    q.then(({ data, error }) => {
      setErro(error ? 'Não foi possível carregar a auditoria: ' + error.message : '');
      setLinhas(data || []);
    });
  }, [tabela]);

  return (
    <main className="container admin">
      <p className="admin__migalhas">Painel / Auditoria</p>
      <h1 className="admin__titulo">Registo de actividade</h1>
      <div className="filtros" role="group" aria-label="Filtrar por área">
        {TABELAS.map(([id, nome]) => <button key={id} type="button" aria-pressed={tabela === id} onClick={() => setTabela(id)}>{nome}</button>)}
      </div>
      <section className="painel">
        {linhas === null && <p className="vazio" style={{ border: 0 }}>A carregar…</p>}
        {erro && <p className="vazio" style={{ border: 0 }}>{erro}</p>}
        {linhas?.length === 0 && !erro && <p className="vazio" style={{ border: 0 }}>Ainda não há actividade registada.</p>}
        {linhas?.length > 0 && (
          <div className="tabela-rolo">
            <table className="tabela">
              <thead><tr><th>Quando</th><th>Quem</th><th>Acção</th><th>Área</th><th>Detalhe</th></tr></thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.id}>
                    <td>{quando(l.quando)}</td>
                    <td>{l.email || '-'}<br /><small style={{ color: 'var(--texto-3)' }}>{PAPEIS[l.papel] || ''}</small></td>
                    <td>{ACCOES[l.accao] || l.accao}</td>
                    <td>{l.tabela}</td>
                    <td style={{ whiteSpace: 'normal', minWidth: 260 }}>{resumo(l.detalhe)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="campo__ajuda" style={{ marginTop: 10 }}>Mostra as 300 acções mais recentes.</p>
    </main>
  );
}

export default function Auditoria() {
  return <Painel papeis={['super_admin']} activa="auditoria.html">{() => <Registo />}</Painel>;
}
