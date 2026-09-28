'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './WelcomeLoader.module.css';

export default function WelcomeLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setVisible(false), reducedMotion ? 200 : 6000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return <div className={styles.overlay} role="status" aria-label="Welcome to Proilan’s portfolio" onAnimationEnd={event => {
    if (event.target === event.currentTarget) setVisible(false);
  }}>
    <div className={styles.content}>
      <div className={styles.portrait}><Image src="/Theme/app-icon-192.png" alt="" width={80} height={80} loading="eager" unoptimized /><span className={styles.ring} aria-hidden="true" /></div>
      <span className={styles.eyebrow}>WELCOME TO MY PORTFOLIO</span>
      <p className={styles.name}>proilan adolfo<span>.</span></p>
      <span className={styles.subtitle}>Ideas. Code. Possibilities.</span>
      <div className={styles.track} aria-hidden="true"><span /></div>
    </div>
  </div>;
}
