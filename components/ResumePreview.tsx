'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, X } from 'lucide-react';
import styles from './Hero/Hero.module.css';

export default function ResumePreview({ label, className }: { label?: string; className?: string } = {}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  function close() {
    dialog.current?.close();
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }
  return <>
    <button ref={trigger} className={className ?? "resume-trigger"} type="button" aria-label={label ?? "Resume"} aria-haspopup="dialog" data-tooltip="Resume" onClick={() => setOpen(true)}><FileText />{label && <span>{label}</span>}</button>
    {open && createPortal(<dialog ref={dialog} className={styles.certificateModal} aria-label="Resume preview" onClose={event => event.stopPropagation()} onCancel={event => { event.preventDefault(); event.stopPropagation(); close(); }} onClick={event => { event.stopPropagation(); if (event.target === event.currentTarget) close(); }}>
      <div className={styles.certificateModalContent}>
        <header className={styles.certificateModalHeader}><h2>Proilan M. Adolfo — Resume</h2><button type="button" autoFocus onClick={close} aria-label="Close resume"><X size={22} /></button></header>
        <iframe className={styles.certificatePdf} src="/resume/Adolfo_Resume.pdf" title="Proilan Adolfo resume PDF" />
        <footer className={styles.certificateModalFooter}><span>Resume preview</span><a href="/resume/Adolfo_Resume.pdf" target="_blank" rel="noopener noreferrer">Open original ↗</a></footer>
      </div>
    </dialog>, document.body)}
  </>;
}
