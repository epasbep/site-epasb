// Painel administrativo: "A minha conta" — ver o papel e mudar a palavra-passe.
import { useState } from 'react';
import { sb } from '../../supabase.js';
import { Painel, PAPEIS } from '../../componentes/Admin.jsx';

function MinhaConta({ sessao, perfil }) {
  const [nova, setNova] = useState('');
  const [repetir, setRepetir] = useState('');
  const [estado, setEstado] = useState(null); // { tipo, texto }
  const [ocupado, setOcupado] = useState(false);

  async function mudar(ev) {
    ev.preventDefault();
    if (nova.length < 10) { setEstado({ tipo: 'erro', texto: 'A palavra-passe tem de ter pelo menos 10 caracteres.' }); return; }
    if (nova !== repetir) { setEstado({ tipo: 'erro', texto: 'As duas palavras-passe não são iguais.' }); return; }
    setOcupado(true);
    const { error } = await sb.auth.updateUser({ password: nova });
    setOcupado(false);
    if (error) { setEstado({ tipo: 'erro', texto: 'Não foi possível mudar: ' + error.message }); return; }
    setNova(''); setRepetir('');
    setEstado({ tipo: 'sucesso', texto: 'Palavra-passe alterada.' });
  }

  return (
    <main className="container admin">
      <p className="admin__migalhas">Painel / A minha conta</p>
      <h1 className="admin__titulo">A minha conta</h1>
      <div className="admin__colunas">
        <section className="form" style={{ flex: '1 1 300px' }}>
          <dl className="detalhes">
            <div><dt>Nome</dt><dd>{perfil.nome || '-'}</dd></div>
            <div><dt>Email</dt><dd>{sessao.user.email}</dd></div>
            <div className="largo"><dt>Papel</dt><dd>{PAPEIS[perfil.papel]}</dd></div>
          </dl>
        </section>
        <form className="form" style={{ flex: '1 1 360px' }} onSubmit={mudar} noValidate>
          <h2 className="h3">Mudar palavra-passe</h2>
          <div className="campo"><label htmlFor="c-nova">Nova palavra-passe</label>
            <input className="input" id="c-nova" type="password" autoComplete="new-password" value={nova} onChange={(e) => setNova(e.target.value)} /></div>
          <div className="campo"><label htmlFor="c-repetir">Repetir a nova palavra-passe</label>
            <input className="input" id="c-repetir" type="password" autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} /></div>
          {estado && <p className={`mensagem mensagem--${estado.tipo}`} role="status">{estado.texto}</p>}
          <div className="form__accoes"><button className="btn btn--primario" type="submit" disabled={ocupado}>{ocupado ? 'A guardar…' : 'Mudar palavra-passe'}</button></div>
        </form>
      </div>
    </main>
  );
}

export default function Conta() {
  return (
    <Painel papeis={Object.keys(PAPEIS)} activa="conta">
      {({ sessao, perfil }) => <MinhaConta sessao={sessao} perfil={perfil} />}
    </Painel>
  );
}
