import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaRegEnvelope, FaArrowRight, FaTimes } from 'react-icons/fa';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import BackToMenu from './BackToMenu.jsx';
const apiUrl = import.meta.env.VITE_API_URL || '';
async function request(path, options) {
  const response = await fetch(`${apiUrl}/api/cartas${path}`, { ...options, headers: { ...options?.headers, 'x-session-id': localStorage.getItem('bia_session_id') || '' } });
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Não foi possível acessar o serviço de cartas. Tente novamente em instantes.');
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Não foi possível concluir. Tente novamente.');
  return data;
}
function CartaAberta({ carta, onClose, onDeleted }) {
  const dialog = useRef(null);
  const [content, setContent] = useState(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const deleteLock = useRef(false);
  async function remove(asAdmin = false) {
    if (deleteLock.current) return;
    const password = asAdmin ? window.prompt('Digite a senha de administrador para excluir esta carta:') : null;
    if (asAdmin && !password) return;
    if (deleteLock.current || !window.confirm('Excluir esta carta? Esta ação não pode ser desfeita.')) return;
    deleteLock.current = true; setDeleting(true); setDeleteError('');
    try { await request('/' + carta.uuid, { method: 'DELETE', headers: password ? { 'x-admin-key': password } : {} }); onDeleted(); }
    catch (error) { setDeleteError(error.message); }
    finally { deleteLock.current = false; setDeleting(false); }
  }
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const previous = carta.trigger || document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current.showModal();
    return () => { document.body.style.overflow = overflow; requestAnimationFrame(() => previous?.focus()); };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    request(`/${carta.uuid}`, { signal: controller.signal }).then(setContent).catch(error => {
      if (error.name !== 'AbortError') setError(error.message);
    });
    return () => controller.abort();
  }, [carta.uuid, retry]);
  return createPortal(<dialog ref={dialog} className="letter-dialog" aria-labelledby="letter-title"
    onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === dialog.current) onClose(); }}>
    <div className="letter-dialog-inner">
      <header className="letter-dialog-header"><span className="eyebrow">UMA CARTA DO REC'N'PLAY</span>
        <button className="theme-toggle" onClick={onClose} aria-label="Fechar carta"><FaTimes /></button></header>
      <h2 id="letter-title">Para {carta.destinatario}</h2>
      <p className="letter-from">Carta de: <strong>{carta.remetente}</strong></p>
      <div className="letter-message" aria-live="polite">
        {error ? <><p role="alert">{error}</p><button className="btn" onClick={() => setRetry(n => n + 1)}>Tentar novamente</button></>
          : content ? content.conteudo : 'Abrindo sua carta…'}
      </div>
      <div className="letter-dialog-footer">{deleteError && <p role="alert" className="form-error">{deleteError}</p>}{content?.canDelete && <button className="btn secondary-btn" disabled={deleting} onClick={() => remove()}>{deleting ? "Excluindo…" : "Excluir carta"}</button>}<button className="btn secondary-btn" disabled={deleting || !content} onClick={() => remove(true)}>{deleting ? "Excluindo…" : "Excluir como admin"}</button><button className="btn" onClick={onClose}>Fechar carta</button></div>
    </div>
  </dialog>, document.body);
}
export default function Cartas() {
  const [remetente, setRemetente] = useState(() => localStorage.getItem('bia_nome') || '');
  const [destinatario, setDestinatario] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const submission = useRef(null);
  const [status, setStatus] = useState(null);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [list, setList] = useState({ data: [], total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [selected, setSelected] = useState(null);
  const [clearing, setClearing] = useState(false);
  const clearLock = useRef(false);
  const [adminStatus, setAdminStatus] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setListError('');
    request(`?page=${page}`, { signal: controller.signal }).then(setList).catch(error => {
      if (error.name !== 'AbortError') setListError(error.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, revision]);
  async function clearAll() {
    if (clearLock.current) return;
    const password = window.prompt('Digite a senha de administrador para apagar todas as cartas:');
    if (!password || !window.confirm('Apagar TODAS as cartas? Esta ação não pode ser desfeita.')) return;
    clearLock.current = true; setClearing(true); setAdminStatus(null);
    try {
      await request('', { method: 'DELETE', headers: { 'x-admin-key': password } });
      setPage(1); setRevision(n => n + 1); setAdminStatus({ text: 'Todas as cartas foram excluídas.' });
    } catch (error) { setAdminStatus({ error: true, text: error.message }); }
    finally { clearLock.current = false; setClearing(false); }
  }
  async function send(event) {
    event.preventDefault();
    if (sendingRef.current) return;
    const fields = { remetente: remetente.trim(), destinatario: destinatario.trim(), conteudo: conteudo.trim() };
    if (Object.values(fields).some(value => !value)) {
      setStatus({ error: true, text: 'Preencha remetente, destinatário e o texto da carta.' }); return;
    }
    const signature = JSON.stringify(fields);
    if (submission.current?.signature !== signature) submission.current = { signature, uuid: crypto.randomUUID() };
    sendingRef.current = true; setSending(true); setStatus(null);
    try {
      await request('', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...fields, uuid: submission.current.uuid }) });
      setConteudo(''); setDestinatario(''); submission.current = null;
      setStatus({ text: 'Carta enviada! Sua mensagem já pode ser lida por todos.' });
      setPage(1); setRevision(n => n + 1);
    } catch (error) { setStatus({ error: true, text: error.message }); }
    finally { sendingRef.current = false; setSending(false); }
  }
  return <main className="container">
    <Header title="Cartas do REC'n'Play" /><BackToMenu />
    <form className="add-form letter-form" onSubmit={send}>
      <div className="form-intro"><h2>Palavras que ficam.</h2><p className="section-description">Uma lembrança, um agradecimento ou uma mensagem especial.</p></div>
      <div className="letter-addresses">
        <div className="form-control"><label htmlFor="letter-sender">Remetente da carta</label><input id="letter-sender" required maxLength={120} value={remetente} onChange={e => setRemetente(e.target.value)} disabled={sending} autoComplete="name" /></div>
        <div className="form-control"><label htmlFor="letter-recipient">Destinatário da carta</label><input id="letter-recipient" required maxLength={120} placeholder="Para quem é esta carta?" value={destinatario} onChange={e => setDestinatario(e.target.value)} disabled={sending} /></div>
      </div>
      <div className="form-control"><label htmlFor="letter-content">Escreva aqui sua carta</label><textarea id="letter-content" required maxLength={10000} rows={6} placeholder="Comece sua mensagem…" value={conteudo} onChange={e => setConteudo(e.target.value)} disabled={sending} aria-describedby="letter-public" /></div>
      <p id="letter-public" className="public-note"><FaRegEnvelope aria-hidden="true" /> As cartas são públicas. Qualquer visitante poderá ler sua mensagem.</p>
      {status && <p role={status.error ? 'alert' : 'status'} className={status.error ? 'form-error' : 'form-success'}>{status.text}</p>}
      <button className="btn btn-block success" disabled={sending}>{sending ? 'Enviando carta…' : 'Enviar carta'}</button>
    </form>
    <section className="letters-section" aria-labelledby="letters-heading" aria-busy={loading}>
      <div className="section-heading"><h2 id="letters-heading">Cartas compartilhadas</h2><span>{list.total} {list.total === 1 ? 'carta' : 'cartas'}</span></div>
      <div className="letters-admin-actions"><button className="btn secondary-btn" disabled={clearing || loading || list.total === 0} onClick={clearAll}>{clearing ? 'Excluindo…' : 'Apagar todas as cartas (admin)'}</button>
        {adminStatus && <p role={adminStatus.error ? 'alert' : 'status'} className={adminStatus.error ? 'form-error' : 'form-success'}>{adminStatus.text}</p>}
      </div>
      {loading ? <p className="empty-state"  role="status">Carregando cartas…</p> : listError ? <div className="empty-state"><p role="alert">{listError}</p><button className="btn" onClick={() => setRevision(n => n + 1)}>Tentar novamente</button></div>
      : list.data.length === 0 ? <div className="empty-state"><FaRegEnvelope className="empty-icon" aria-hidden="true" /><h3>A primeira carta pode ser sua.</h3><p>Dedique algumas palavras a alguém que fez parte deste encontro.</p></div>
      : <div className="letters-grid">{list.data.map(carta => <button key={carta.uuid} className="letter-card" onClick={event => setSelected({ ...carta, trigger: event.currentTarget })} aria-haspopup="dialog">
        <FaRegEnvelope className="letter-icon" aria-hidden="true" /><span className="letter-card-details"><strong>Carta de: {carta.remetente}</strong><span>Para: {carta.destinatario}</span><span className="letter-open">Abrir carta <FaArrowRight aria-hidden="true" /></span></span>
      </button>)}</div>}
      {list.totalPages > 1 && <nav className="letter-pagination" aria-label="Páginas de cartas"><button className="btn secondary-btn" disabled={page === 1 || loading} onClick={() => setPage(p => p - 1)}>Anterior</button><span>Página {page} de {list.totalPages}</span><button className="btn secondary-btn" disabled={page >= list.totalPages || loading} onClick={() => setPage(p => p + 1)}>Próxima</button></nav>}
    </section><Footer />{selected && <CartaAberta carta={selected} onClose={() => setSelected(null)} onDeleted={() => { setSelected(null); setPage(1); setRevision(n => n + 1); setStatus({ text: "Carta excluída com sucesso." }); }} />}
  </main>;
}
