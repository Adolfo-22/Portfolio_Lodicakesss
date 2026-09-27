'use client';

import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import styles from './Hero.module.css';

type Certificate = { title: string; file: string; format: string };

export default function CertificateViewer({ certificate }: { certificate: Certificate }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  function close() {
    dialog.current?.close();
    setOpen(false);
  }
  return <>
    <button type="button" className={styles.certificateLink} aria-haspopup="dialog" aria-label={`View ${certificate.title} certificate`} onClick={() => { setOpen(true); dialog.current?.showModal(); }}>View certificate <span>{certificate.format} ↗</span></button>
    <dialog ref={dialog} className={styles.certificateModal} aria-label={certificate.title} onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className={styles.certificateModalContent}>
        <header className={styles.certificateModalHeader}><h2>{certificate.title}</h2><button type="button" autoFocus onClick={close} aria-label="Close certificate"><X size={22} /></button></header>
        {open && (certificate.format === 'PDF' ? <iframe className={styles.certificatePdf} src={certificate.file} title={`${certificate.title} certificate PDF`} /> : <div className={styles.certificateImage}>
          {/* Preserve the original document resolution for reading certificate text. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={certificate.file} alt={`${certificate.title} certificate`} />
        </div>)}
        <footer className={styles.certificateModalFooter}><span>Certificate preview</span><a href={certificate.file} target="_blank" rel="noopener noreferrer">Open original ↗</a></footer>
      </div>
    </dialog>
  </>;
}
