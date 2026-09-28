'use client';

import { useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { profile } from '@/data/profile';
import styles from './Hero.module.css';

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    if (String(fields.get('website') || '')) return;
    const message = String(fields.get('message') || '').trim();
    const name = String(fields.get('name') || '').trim();
    if (!name || message.length < 10) {
      const input = form.elements.namedItem(!name ? 'name' : 'message') as HTMLInputElement | HTMLTextAreaElement;
      input.setCustomValidity(!name ? 'Please enter your name.' : 'Please write at least 10 characters.');
      input.reportValidity();
      input.addEventListener('input', () => input.setCustomValidity(''), { once: true });
      return;
    }
    setStatus('sending');
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${profile.email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name,
          email: String(fields.get('email') || '').trim(),
          message,
          _subject: 'New message from your portfolio',
          _template: 'table',
          _url: window.location.href,
        }),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok || ![true, 'true'].includes(result.success)) throw new Error('Submission failed');
      setStatus('success');
      form.reset();
    } catch { setStatus('error'); }
  }
  return <div className={styles.messageCard}>
    <header className={styles.messageHeader}><div className={styles.messageAvatar}><MessageCircle size={22} aria-hidden="true" /></div><div><h3>Leave me a message</h3><p>A conversation starts with hello.</p></div></header>
    <div className={styles.messageBubble}>Hi there! Tell me a little about yourself and what you have in mind.</div>
    <form onSubmit={sendMessage} className={styles.messageForm}>
      <div className={styles.messageFields}><label>Your name<input name="name" autoComplete="name" placeholder="How should I call you?" required maxLength={100} disabled={status === 'sending'} /></label><label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} disabled={status === 'sending'} /></label></div>
      <label>Your message<textarea name="message" placeholder="Hi Proilan, I’d like to talk about…" rows={5} required minLength={10} maxLength={5000} disabled={status === 'sending'} /></label>
      <label className={styles.messageTrap} aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <div className={styles.messageSend}><span>I’ll reply to the email you provide.</span><button type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send message'}<Send size={16} aria-hidden="true" /></button></div>
      {status === 'success' && <p className={styles.messageStatus} role="status">Your message was submitted. Thanks for reaching out!</p>}
      {status === 'error' && <p className={styles.messageError} role="alert">Couldn’t confirm your message was submitted. Your text is still here—please try again or <a href={`mailto:${profile.email}`}>email me directly</a>.</p>}
    </form>
  </div>;
}
