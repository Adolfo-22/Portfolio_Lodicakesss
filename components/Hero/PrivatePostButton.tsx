'use client';

import { useEffect, useRef, useState } from 'react';
import PrivateGallery, { type GallerySession } from '@/app/private/PrivateGallery';
import { LockKeyhole, X } from 'lucide-react';
import styles from './Hero.module.css';

export default function PrivatePostButton({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [session, setSession] = useState<GallerySession | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [isOpen]);
  const dialog = useRef<HTMLDialogElement>(null);
  const pending = useRef<AbortController | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  function close() {
    pending.current?.abort();
    pending.current = null;
    dialog.current?.close();
    setPassword(''); setError(''); setBusy(false);
    setSession(null); setIsOpen(false);
    onOpenChange(false);
  }
  async function unlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true); setError('');
    try {
      const response = await fetch('/private/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }), cache: 'no-store', signal: controller.signal });
      const data = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) { setError(data.error || 'Could not open the post.'); return; }
      setPassword('');
      setSession(data);
    } catch { if (!controller.signal.aborted) setError('Could not connect. Please try again.'); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  return <>
    <button type="button" className={styles.openPost} onClick={() => { setIsOpen(true); onOpenChange(true); dialog.current?.showModal(); }}><LockKeyhole size={16} aria-hidden="true" /> Open post <span aria-hidden="true">↗</span></button>
    <dialog ref={dialog} className={`${styles.passwordModal} ${session ? styles.privateGalleryModal : ""}`} aria-label="Just us — private post" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      {session ? <div className={styles.privateGalleryContent}><header className={styles.privateGalleryHeader}><span>Just us · private album</span><button type="button" onClick={close} aria-label="Close private post"><X size={22} /></button></header><PrivateGallery embedded initialSession={session} /></div> : <div className={styles.passwordPanel}>
        <button type="button" className={styles.passwordClose} aria-label="Close password dialog" onClick={close}><X size={20} /></button>
        <LockKeyhole size={28} aria-hidden="true" />
        <h2 id="private-password-title">Just us</h2>
        <p>Enter the password to open this private post.</p>
        <form onSubmit={unlock}>
          <label htmlFor="private-post-password">Password</label>
          <input autoFocus id="private-post-password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required maxLength={256} />
          {error && <p role="alert">{error}</p>}
          <button type="submit" className={styles.openPost} disabled={busy}>{busy ? 'Opening…' : 'Unlock post'}</button>
        </form>
      </div>}
    </dialog>
  </>;
}
