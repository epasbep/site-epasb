// Painel administrativo: formulário "Publicar notícia".
import { useEffect, useRef, useState } from 'react';
import { sb } from '../../supabase.js';
import { publishNews } from '../../api.js';
import { formatarData } from '../../util.js';
import { useSessao, Topo } from '../../componentes/Admin.jsx';
import { Tanque } from '../../componentes/Torneira.jsx';
import { LIMITES, ytId, adicionarFotos, tornarCapa, validar, validarVideo, guardarRascunho, lerRascunho, apagarRascunho } from '../../publicar.js';

const VAZIO = { titulo: '', autor: '', breve: '', descricao: '' };
const MODOS = [['nenhum', 'Sem vídeo'], ['link', 'Link do YouTube'], ['ficheiro', 'Carregar ficheiro']];
const TEXTOS = {
  enviar: ['A publicar…', (n) => `A carregar ${n === 1 ? '1 fotografia' : n + ' fotografias'}. Não feche esta página.`],
  sucesso: ['Notícia publicada', () => 'Já está visível na página de Notícias do site.'],
  erro: ['Não foi possível publicar', () => 'A ligação falhou. O rascunho foi guardado — tente novamente.']
};

function Formulario({ sessao }) {
  const rascunho = useRef(lerRascunho()).current;
  const [campos, setCampos] = useState({ ...VAZIO, ...(rascunho && { titulo: rascunho.titulo || '', autor: rascunho.autor || '', breve: rascunho.breve || '', descricao: rascunho.descricao || '' }) });
  const [fotos, setFotos] = useState([]); // { ficheiro, url }
  const [videoModo, setVideoModo] = useState(rascunho?.videoModo === 'link' ? 'link' : 'nenhum');
  const [videoLink, setVideoLink] = useState(rascunho?.videoLink || '');
  const [videoFicheiro, setVideoFicheiro] = useState(null);
  const [erros, setErros] = useState({});
  const [aviso, setAviso] = useState('');
  const [aArrastar, setAArrastar] = useState(false);
  const [envio, setEnvio] = useState(null); // null | { fase, progresso, detalhe, id }
  const form = useRef(null);
  const recuperado = useRef(!!(rascunho?.titulo || rascunho?.descricao)).current;

  // Guarda o texto à medida que se escreve (as fotografias não cabem no armazenamento do browser).
  useEffect(() => {
    guardarRascunho({ ...campos, videoModo: videoModo === 'link' ? 'link' : 'nenhum', videoLink });
  }, [campos, videoModo, videoLink]);

  // Avisar antes de sair a meio de um envio.
  useEffect(() => {
    const sair = (e) => { if (envio?.fase === 'enviar') e.preventDefault(); };
    window.addEventListener('beforeunload', sair);
    return () => window.removeEventListener('beforeunload', sair);
  }, [envio?.fase]);

  const semErro = (c) => setErros((e) => ({ ...e, [c]: undefined }));
  const mudar = (e) => { setCampos((c) => ({ ...c, [e.target.name]: e.target.value })); semErro(e.target.name); };

  // ---------- Fotografias ----------
  function juntar(ficheiros) {
    const r = adicionarFotos(fotos, ficheiros);
    if (r.fotos.length > fotos.length) semErro('fotos');
    setFotos(r.fotos);
    setAviso(r.aviso);
    setAArrastar(false);
  }
  function remover(i) {
    URL.revokeObjectURL(fotos[i].url);
    setFotos(fotos.filter((_, k) => k !== i));
    setAviso('');
  }

  // ---------- Vídeo ----------
  const idYoutube = videoModo === 'link' ? ytId(videoLink) : null;
  function escolherVideo(e) {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    const problema = validarVideo(f);
    setErros((x) => ({ ...x, video: problema || undefined }));
    if (!problema) setVideoFicheiro(f);
  }

  // ---------- Limpar ----------
  function limpar(manterAutor) {
    fotos.forEach((f) => URL.revokeObjectURL(f.url));
    setCampos({ ...VAZIO, autor: manterAutor ? campos.autor : '' });
    setFotos([]); setVideoModo('nenhum'); setVideoLink(''); setVideoFicheiro(null);
    setErros({}); setAviso('');
    apagarRascunho();
  }

  // ---------- Publicar ----------
  async function publicar(ev) {
    ev?.preventDefault();
    const novos = validar({ ...campos, fotos, videoModo, videoLink, videoFicheiro });
    setErros(novos);
    const primeiro = Object.keys(novos)[0];
    if (primeiro) {
      setEnvio(null);
      const alvo = form.current.elements[primeiro] || form.current.querySelector(`[data-campo="${primeiro}"]`);
      alvo?.scrollIntoView({ block: 'center' });
      alvo?.focus?.();
      return;
    }

    let progresso = 0;
    setEnvio({ fase: 'enviar', progresso: 0 });
    try {
      const { data } = await sb.auth.getSession();
      if (!data.session) throw new Error('A sessão expirou. Entre de novo no painel.');
      let video = null;
      if (videoModo === 'link') video = { type: 'youtube', id: ytId(videoLink) };
      if (videoModo === 'ficheiro') video = { type: 'file', ficheiro: videoFicheiro };
      const id = await publishNews({
        title: campos.titulo.trim(), author: campos.autor.trim(), short: campos.breve.trim(), body: campos.descricao.trim(),
        fotos: fotos.map((f) => f.ficheiro), video
      }, (p) => { progresso = p; setEnvio({ fase: 'enviar', progresso: p }); }, data.session.access_token);
      apagarRascunho();
      setEnvio({ fase: 'sucesso', progresso: 100, id });
    } catch (e) {
      console.error('Publicar notícia:', e);
      setEnvio({ fase: 'erro', progresso, detalhe: `Detalhe técnico: ${e.message}` });
    }
  }

  const hoje = new Date().toLocaleDateString('sv'); // AAAA-MM-DD na hora local
  const campo = (nome) => `campo${erros[nome] ? ' campo--erro' : ''}`;

  return (
    <>
      <Topo sessao={sessao} activa="nova-noticia.html" />
      <main className="container admin">
        <p className="admin__migalhas">Painel / Notícias / Nova notícia</p>
        <h1 className="admin__titulo">Publicar notícia</h1>
        {recuperado && <p className="mensagem mensagem--sucesso" style={{ marginBottom: 20 }}>Recuperámos o rascunho que estava a escrever. Escolha de novo as fotografias.</p>}

        <div className="admin__colunas">
          <form className="form" ref={form} onSubmit={publicar} noValidate>
            <div className={campo('titulo')}>
              <div className="campo__topo"><label htmlFor="f-titulo">Título *</label><span className="campo__contador">{campos.titulo.length}/{LIMITES.titulo}</span></div>
              <input className="input" id="f-titulo" name="titulo" maxLength={LIMITES.titulo} placeholder="Ex.: Interrupção programada no Lobito" value={campos.titulo} onChange={mudar} />
              <p className="campo__erro">{erros.titulo}</p>
            </div>
            <div className={campo('autor')}>
              <label htmlFor="f-autor">Autor *</label>
              <input className="input" id="f-autor" name="autor" placeholder="Nome ou gabinete responsável" autoComplete="off" value={campos.autor} onChange={mudar} />
              <p className="campo__erro">{erros.autor}</p>
            </div>
            <div className={campo('breve')}>
              <div className="campo__topo"><label htmlFor="f-breve">Breve descrição *</label><span className="campo__contador">{campos.breve.length}/{LIMITES.breve}</span></div>
              <p className="campo__ajuda">Aparece no cartão da notícia e na partilha.</p>
              <textarea className="textarea" id="f-breve" name="breve" maxLength={LIMITES.breve} rows="3" value={campos.breve} onChange={mudar} />
              <p className="campo__erro">{erros.breve}</p>
            </div>
            <div className={campo('descricao')}>
              <label htmlFor="f-descricao">Descrição *</label>
              <p className="campo__ajuda">Texto completo. Deixe uma linha em branco entre parágrafos.</p>
              <textarea className="textarea" id="f-descricao" name="descricao" rows="9" value={campos.descricao} onChange={mudar} />
              <p className="campo__erro">{erros.descricao}</p>
            </div>

            <div className={campo('fotos')} data-campo="fotos">
              <div className="campo__topo"><span className="campo__label">Fotografias *</span>
                <span className="campo__contador" style={{ fontWeight: 700, color: 'var(--azul-escuro)' }}>{fotos.length} / {LIMITES.fotos}</span></div>
              <p className="campo__ajuda">Até 10 fotografias, JPG ou PNG, máx. 5 MB cada. A primeira é a capa.</p>
              <div className={`fotos${aArrastar ? ' arrastar' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setAArrastar(true); }} onDragLeave={() => setAArrastar(false)}
                onDrop={(e) => { e.preventDefault(); juntar(e.dataTransfer.files); }}>
                {fotos.map((f, i) => (
                  <div className="foto" key={f.url}>
                    <img src={f.url} alt={`Fotografia ${i + 1}`} />
                    {i === 0
                      ? <span className="foto__capa">Capa</span>
                      : <button className="foto__tornar" type="button" onClick={() => setFotos(tornarCapa(fotos, i))}>Tornar capa</button>}
                    <button className="foto__remover" type="button" aria-label={`Remover fotografia ${i + 1}`} onClick={() => remover(i)}>×</button>
                  </div>
                ))}
                {fotos.length < LIMITES.fotos && (
                  <label className="foto-adicionar">
                    <b>+</b><span>Adicionar</span><small>faltam {LIMITES.fotos - fotos.length}</small>
                    <input className="sr" type="file" multiple accept="image/jpeg,image/png" aria-label="Adicionar fotografias"
                      onChange={(e) => { juntar(e.target.files); e.target.value = ''; }} />
                  </label>
                )}
              </div>
              <p className="campo__aviso" role="status">{aviso}</p>
              <p className="campo__erro">{erros.fotos}</p>
            </div>

            <div className={campo('video')} data-campo="video">
              <span className="campo__label">Vídeo (opcional)</span>
              <p className="campo__ajuda">Aparece em primeiro no carrossel e só carrega quando o leitor toca em reproduzir.</p>
              <div className="segmentos" role="group" aria-label="Tipo de vídeo">
                {MODOS.map(([modo, nome]) => (
                  <button key={modo} type="button" aria-pressed={videoModo === modo} onClick={() => { setVideoModo(modo); semErro('video'); }}>{nome}</button>
                ))}
              </div>
              {videoModo === 'link' && (
                <>
                  <input className="input" type="url" inputMode="url" placeholder="https://youtu.be/…" aria-label="Link do YouTube" style={{ marginTop: 10 }}
                    value={videoLink} onChange={(e) => { setVideoLink(e.target.value); semErro('video'); }} />
                  {idYoutube && (
                    <div className="video-ok"><img src={`https://i.ytimg.com/vi/${idYoutube}/mqdefault.jpg`} alt="" /><span>✓ Vídeo do YouTube reconhecido</span></div>
                  )}
                </>
              )}
              {videoModo === 'ficheiro' && (
                <>
                  {videoFicheiro && (
                    <div className="video-ok" style={{ color: 'var(--texto)' }}>
                      <span>{videoFicheiro.name}</span>
                      <button className="btn btn--secundario" type="button" style={{ minHeight: 40 }} onClick={() => setVideoFicheiro(null)}>Remover</button>
                    </div>
                  )}
                  <label className="ficheiro" style={{ marginTop: 10 }}>Escolher vídeo MP4 (máx. 50 MB)
                    <input className="sr" type="file" accept="video/mp4" onChange={escolherVideo} />
                  </label>
                </>
              )}
              <p className="campo__erro">{erros.video}</p>
            </div>

            <div className="form__accoes">
              <button className="btn btn--primario" type="submit">Publicar notícia</button>
              <button className="btn btn--secundario" type="button" onClick={() => { if (confirm('Limpar todo o formulário?')) limpar(false); }}>Limpar</button>
            </div>
          </form>

          <aside className="admin__previa" aria-label="Pré-visualização do cartão">
            <p>Pré-visualização do cartão</p>
            <article className="cartao">
              <div className="cartao__media">{fotos[0] ? <img src={fotos[0].url} alt="" /> : 'Sem fotografia de capa'}</div>
              <div className="cartao__corpo">
                <p className="cartao__meta">{formatarData(hoje)} · {campos.autor.trim() || 'Autor'}</p>
                <h2 className="cartao__titulo">{campos.titulo.trim() || 'Título da notícia'}</h2>
                <p className="cartao__resumo">{campos.breve.trim() || 'A breve descrição aparece aqui.'}</p>
              </div>
            </article>
          </aside>
        </div>
      </main>

      {envio && (
        <div className="modal">
          <div className="modal__caixa" role="dialog" aria-modal="true" aria-labelledby="m-titulo" aria-live="polite">
            <Tanque fase={envio.fase} progresso={envio.progresso} />
            <h2 id="m-titulo">{TEXTOS[envio.fase][0]}</h2>
            <p>{TEXTOS[envio.fase][1](fotos.length)}</p>
            {envio.detalhe && <p className="campo__ajuda" style={{ margin: 0, overflowWrap: 'anywhere' }}>{envio.detalhe}</p>}
            {envio.fase === 'enviar' && <div className="progresso"><div style={{ width: `${envio.progresso}%` }} /></div>}
            {envio.fase === 'sucesso' && (
              <div className="botoes">
                <a className="btn btn--primario" href={`../noticia.html?id=${encodeURIComponent(envio.id)}`}>Ver notícia</a>
                <button className="btn btn--secundario" type="button" onClick={() => { setEnvio(null); limpar(true); }}>Publicar outra</button>
              </div>
            )}
            {envio.fase === 'erro' && (
              <div className="botoes">
                <button className="btn btn--primario" type="button" onClick={() => publicar()}>Tentar novamente</button>
                <button className="btn btn--secundario" type="button" onClick={() => setEnvio(null)}>Voltar ao formulário</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function NovaNoticia() {
  const sessao = useSessao();
  useEffect(() => { if (sessao === null) location.replace('index.html'); }, [sessao]);
  return sessao ? <Formulario sessao={sessao} /> : null;
}
