"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { FileText, Mail, Moon, Sun, X } from "lucide-react";
import { profile } from "@/data/profile";
import { FaDiscord, FaFacebook, FaGithub, FaLinkedin, FaYoutube } from "react-icons/fa6";

type MobileNavigationProps = {
  children: ReactNode;
  navigation: readonly (readonly [string, string])[];
  activeSection: string | null;
  onNavigate: (id: string) => void;
  selectedDarkMode: boolean;
  onThemeToggle: () => void;
};

export default function MobileNavigation({ children, navigation, activeSection, onNavigate, selectedDarkMode, onThemeToggle }: MobileNavigationProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoreScroll = useRef<(() => void) | null>(null);
  const destination = useRef<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    const mobileViewport = window.matchMedia("(max-width: 900px)");
    const closeOnDesktop = () => {
      if (!mobileViewport.matches && dialog?.open) {
        destination.current = null;
        dialog.close();
      }
    };
    mobileViewport.addEventListener("change", closeOnDesktop);
    return () => {
      mobileViewport.removeEventListener("change", closeOnDesktop);
      if (closeTimer.current) clearTimeout(closeTimer.current);
      restoreScroll.current?.();
    };
  }, []);

  const openMenu = () => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    destination.current = null;

    // Fix the body as well as locking overflow so touch scrolling stays put on iOS.
    const { body, documentElement } = document;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
      rootOverflow: documentElement.style.overflow,
    };
    restoreScroll.current = () => {
      Object.assign(body.style, {
        position: previous.position,
        top: previous.top,
        width: previous.width,
        overflow: previous.overflow,
      });
      documentElement.style.overflow = previous.rootOverflow;
      window.scrollTo({ top: scrollY, behavior: "instant" });
      restoreScroll.current = null;
    };
    Object.assign(body.style, { position: "fixed", top: `-${scrollY}px`, width: "100%", overflow: "hidden" });
    documentElement.style.overflow = "hidden";
    dialog.showModal();
    setIsOpen(true);
  };

  const closeMenu = (id?: string) => {
    if (!dialogRef.current?.open || closeTimer.current) return;
    destination.current = id ?? null;
    setIsClosing(true);
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220;
    closeTimer.current = setTimeout(() => dialogRef.current?.close(), duration);
  };

  const handleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
    setIsOpen(false);
    setIsClosing(false);
    restoreScroll.current?.();

    const id = destination.current;
    destination.current = null;
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    onNavigate(id);
    if (window.location.hash !== `#${id}`) window.history.pushState(null, "", `#${id}`);
    target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    // Move keyboard/screen-reader focus to the selected section without a second scroll.
    const previousTabIndex = target.getAttribute("tabindex");
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    target.addEventListener("blur", () => {
      if (previousTabIndex === null) target.removeAttribute("tabindex");
      else target.setAttribute("tabindex", previousTabIndex);
    }, { once: true });
  };

  return (
    <>
      <header className="responsive-header">
        {children}
        <div className="mobile-header-info">
          <a className="mobile-header-name" href="#home" aria-label={`${profile.displayName} — back to home`}>{profile.displayName}</a>
          <div className="mobile-header-meta">
            <span>{profile.location}</span>
            <a href={profile.phone.href}>{profile.phone.label}</a>
          </div>
          <a className="mobile-header-email" href={`mailto:${profile.email}`}>{profile.email}</a>
          <button
            type="button"
            className="mobile-theme-toggle"
            aria-label="Toggle color theme"
            aria-pressed={selectedDarkMode}
            title={`Switch to ${selectedDarkMode ? "light" : "dark"} theme`}
            onClick={onThemeToggle}
          >
            <span className="mobile-theme-track" aria-hidden="true">
              <span className="mobile-theme-thumb" />
              <Sun className="mobile-theme-sun" />
              <Moon className="mobile-theme-moon" />
            </span>
          </button>
        </div>
        <button type="button" className="mobile-menu-button" aria-label="Open navigation" aria-haspopup="dialog" aria-controls="mobile-menu" aria-expanded={isOpen} onClick={openMenu}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>
      <dialog
        ref={dialogRef}
        id="mobile-menu"
        className="mobile-menu"
        aria-labelledby="mobile-menu-title"
        data-closing={isClosing}
        onCancel={(event) => { event.preventDefault(); closeMenu(); }}
        onClose={handleClose}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const focusable = event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeMenu();
        }}
      >
        <div className="mobile-menu-heading">
          <span id="mobile-menu-title">proilan adolfo</span>
          <button type="button" className="mobile-menu-close" aria-label="Close navigation" onClick={() => closeMenu()}><X aria-hidden="true" size={22} strokeWidth={1.5} /></button>
        </div>
        <nav className="mobile-menu-links" aria-label="Mobile navigation">
          {navigation.map(([id, label], index) => (
            <a key={id} href={`#${id}`} aria-current={activeSection === id ? "location" : undefined} onClick={(event) => { event.preventDefault(); closeMenu(id); }}>
              <span className="mobile-menu-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="mobile-menu-dash" aria-hidden="true">—</span>
              <span>{label}</span>
              <span className="mobile-menu-arrow" aria-hidden="true">↗</span>
            </a>
          ))}
        </nav>
        <nav className="mobile-menu-socials" aria-label="Mobile social links">
          <a href="https://github.com/" target="_blank" rel="noreferrer" aria-label="GitHub"><FaGithub /></a>
          <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><FaLinkedin /></a>
          <a href="https://discord.com/" target="_blank" rel="noreferrer" aria-label="Discord"><FaDiscord /></a>
          <a href="https://youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube"><FaYoutube /></a>
          <a href="https://facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook"><FaFacebook /></a>
          <a href="mailto:proilan@example.com" aria-label="Email"><Mail /></a>
          <a href="/resume.pdf" download aria-label="Resume"><FileText /></a>
        </nav>
      </dialog>
    </>
  );
}
