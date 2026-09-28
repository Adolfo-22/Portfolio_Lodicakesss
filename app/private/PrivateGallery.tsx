'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { ArrowLeft, Heart, LockKeyhole, X } from 'lucide-react';
import styles from './gallery.module.css';

type Photo = { id: string; width: number; height: number };
export type GallerySession = { photos: Photo[]; expiresAt: number };
export default function PrivateGallery({ embedded = false, initialSession = null }: { embedded?: boolean; initialSession?: GallerySession | null }) {
  const [session, setSession] = useState<GallerySession | null>(initialSession);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Photo | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const photoTrigger = useRef<HTMLButtonElement | null>(null);
  const [photoStatus, setPhotoStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  function closePhoto() {
    dialog.current?.close();
    setSelected(null);
    photoTrigger.current?.focus({ preventScroll: true });
  }
  const requestVersion = useRef(0);
  const checkSession = useCallback(async () => {
    const version = ++requestVersion.current;
    try {
      const response = await fetch('/private/session', { cache: 'no-store' });
      const data = await response.json();
      if (version !== requestVersion.current) return;
      setSession(response.ok ? data : null);
      if (!response.ok) setSelected(null);
      if (response.status === 503) setError(data.error);
    } catch { if (version === requestVersion.current) { setSession(null); setSelected(null); setError('Could not connect. Please try again.'); } }
    finally { if (version === requestVersion.current) setBusy(false); }
  }, []);
  useEffect(() => {
    const initialCheck = window.setTimeout(() => { void checkSession(); }, 0);
    const refresh = () => { if (!document.hidden) void checkSession(); };
    window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearTimeout(initialCheck); window.removeEventListener('pageshow', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [checkSession]);
  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(() => { setSession(null); setSelected(null); setError('Your session ended. Enter the password again.'); }, Math.max(0, session.expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [session]);
  useEffect(() => {
    const viewer = dialog.current;
    if (selected) viewer?.showModal();
    return () => { viewer?.close(); };
  }, [selected]);
  async function unlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    requestVersion.current++;
    setBusy(true); setError('');
    try {
      const response = await fetch('/private/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }), cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Could not unlock the album.'); return; }
      setSession(data); setPassword('');
    } catch { setError('Could not connect. Please try again.'); }
    finally { setBusy(false); }
  }
  async function lock() {
    requestVersion.current++;
    setBusy(true); setError(''); setSelected(null); setSession(null);
    try {
      const response = await fetch('/private/session', { method: 'DELETE', cache: 'no-store' });
      if (!response.ok) throw new Error('logout');
    } catch { setError('Could not end the session. Reconnect and press “End session” again.'); }
    finally { setBusy(false); }
  }
  return <div className={styles.page}>
    <nav className={styles.nav}>{!embedded && <Link href="/"><ArrowLeft size={17} /> Back to portfolio</Link>}{session && <button onClick={lock} disabled={busy}><LockKeyhole size={16} /> Lock album</button>}</nav>
    <header className={styles.heading}><span className={styles.eyebrow}>A LITTLE CORNER FOR US</span><h1>Just us<span>.</span></h1><p>The little moments. The big smiles. Our favorite memories.</p></header>
    {session ? <><div className={styles.albumLabel}><span><Heart size={16} /> Our moments</span><span>{session.photos.length} photos</span></div><div className={styles.grid}>{session.photos.map((photo, index) => <button className={styles.photo} key={photo.id} onClick={event => { photoTrigger.current = event.currentTarget; setPhotoStatus("loading"); setSelected(photo); }} aria-label={`Open memory ${index + 1}`}><Image unoptimized src={`/private/photos/${photo.id}?variant=thumb`} alt={`Our memory ${index + 1}`} width={photo.width} height={photo.height} /><span>{String(index + 1).padStart(2, '0')} / a moment to keep</span></button>)}</div></> : <section className={styles.gate} aria-label="Password-protected album"><div className={styles.lock}><LockKeyhole size={28} /></div><h2>A few memories, just for us.</h2><p>This album is private. Enter the password to take a look.</p><form onSubmit={unlock}><label htmlFor="gallery-password">Album password</label><input id="gallery-password" type="password" autoComplete="current-password" required maxLength={256} value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter password" disabled={busy} /><button type="submit" disabled={busy}>{busy ? 'Please wait…' : 'Unlock album'} <Heart size={16} /></button></form>{error && <p role="alert" className={styles.error}>{error}</p>}{error.includes('End session') && <button onClick={lock}>End session</button>}<small><LockKeyhole size={12} /> Password required · Session lasts one hour</small></section>}
    {selected && createPortal(<dialog ref={dialog} className={styles.viewer} aria-label="Full size private photo" onCancel={event => { event.preventDefault(); event.stopPropagation(); closePhoto(); }} onClose={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); if (event.target === event.currentTarget) closePhoto(); }}>
      <button autoFocus className={styles.close} onClick={closePhoto} aria-label="Close photo"><X /></button>
      {photoStatus === 'loading' && <p className={styles.photoNotice} role="status">Loading photo…</p>}
      {photoStatus === 'error' && <p className={styles.photoNotice} role="alert">Couldn’t load this photo. Close it and try again.</p>}
      <Image unoptimized loading="eager" src={`/private/photos/${selected.id}`} alt="Our memory, full size" width={selected.width} height={selected.height} onLoad={() => setPhotoStatus('ready')} onError={() => setPhotoStatus('error')} />
    </dialog>, document.body)}
    <footer className={styles.footer}>Small moments. Always worth keeping.</footer>
  </div>;
}
