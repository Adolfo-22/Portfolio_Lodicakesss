"use client";

import { useEffect, useRef, useState } from "react";
import Hero from "@/components/Hero/Hero";
import { FileText, Mail, Moon, Sun } from "lucide-react";
import { FaDiscord, FaFacebook, FaGithub, FaLinkedin, FaYoutube } from "react-icons/fa6";

const navigation = [
  ["about", "strategies"],
  ["writing", "blog"],
  ["projects", "projects"],
  ["experience", "experience"],
  ["education", "education"],
  ["contact", "contact"],
] as const;

// First dark frame in /Theme/video.mp4, verified at 3.208333 seconds.
const THEME_SWITCH_TIME = 3.208333;

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedDarkMode, setSelectedDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [mobileSocialOpen, setMobileSocialOpen] = useState(false);
  const themeVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
  }, [darkMode]);

  // Follow the displayed video frame in either direction, including seeks
  // and pauses. The theme must not run on a separate click countdown.
  useEffect(() => {
    const video = themeVideoRef.current;
    if (!video) return;
    let lastFrameDark: boolean | null = null;

    const syncTheme = (mediaTime: number) => {
      const frameDark = mediaTime >= THEME_SWITCH_TIME;
      if (frameDark === lastFrameDark) return;
      lastFrameDark = frameDark;
      // Apply the colors during the frame callback, before React's next render.
      document.documentElement.dataset.theme = frameDark ? "dark" : "light";
      setDarkMode(frameDark);
    };

    if (typeof video.requestVideoFrameCallback === "function") {
      let frameCallback = 0;
      const onVideoFrame: VideoFrameRequestCallback = (_now, metadata) => {
        syncTheme(metadata.mediaTime);
        frameCallback = video.requestVideoFrameCallback(onVideoFrame);
      };
      frameCallback = video.requestVideoFrameCallback(onVideoFrame);
      return () => video.cancelVideoFrameCallback(frameCallback);
    }

    // Older browsers can still follow playback and completed reverse seeks.
    const syncCurrentFrame = () => {
      if (!video.seeking) syncTheme(video.currentTime);
    };
    video.addEventListener("loadeddata", syncCurrentFrame);
    video.addEventListener("timeupdate", syncCurrentFrame);
    video.addEventListener("seeked", syncCurrentFrame);
    return () => {
      video.removeEventListener("loadeddata", syncCurrentFrame);
      video.removeEventListener("timeupdate", syncCurrentFrame);
      video.removeEventListener("seeked", syncCurrentFrame);
    };
  }, []);

  // Start paused in daylight. Each toggle plays from the current position,
  // so changing direction during playback does not restart the clip.
  useEffect(() => {
    const video = themeVideoRef.current;
    if (!video) return;
    let cancelled = false;
    let frame = 0;

    // Seek backward at the video's original speed, allowing each frame to
    // decode before the next seek. This also provides a forward fallback.
    const animateFrames = (direction: 1 | -1) => {
      const start = video.currentTime;
      const startedAt = performance.now();

      const advance = (timestamp: number) => {
        if (cancelled) return;
        const elapsed = (timestamp - startedAt) / 1000;
        const target = Math.min(video.duration, Math.max(0, start + direction * elapsed));
        const reachedEnd = direction === 1 ? target === video.duration : target === 0;

        if (!video.seeking && (Math.abs(video.currentTime - target) >= 1 / 30 || reachedEnd)) {
          video.currentTime = target;
          if (reachedEnd) return;
        }
        frame = requestAnimationFrame(advance);
      };
      frame = requestAnimationFrame(advance);
    };

    const startPlayback = () => {
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;
      video.pause();

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        video.currentTime = selectedDarkMode ? duration : 0;
      } else if (selectedDarkMode && video.currentTime < duration) {
        video.playbackRate = 1;
        void video.play().catch(() => {
          if (!cancelled) animateFrames(1);
        });
      } else if (!selectedDarkMode && video.currentTime > 0) {
        animateFrames(-1);
      }
    };

    if (video.readyState >= 1) {
      startPlayback();
    } else {
      video.addEventListener("loadedmetadata", startPlayback, { once: true });
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      video.removeEventListener("loadedmetadata", startPlayback);
      video.pause();
    };
  }, [selectedDarkMode]);

  useEffect(() => {
    const sections = navigation
      .map(([id]) => document.getElementById(id))
      .filter((section): section is HTMLElement => section?.tagName === "SECTION");
    const observer = new IntersectionObserver(
      (entries) => {
        if (window.scrollY < 120) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-20% 0px -65%", threshold: [0.1, 0.35, 0.7] }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="site-shell" data-theme={darkMode ? "dark" : "light"}>
      <aside className="icon-sidebar" aria-label="Quick links">
        <a href="https://github.com/" target="_blank" rel="noreferrer" aria-label="GitHub" data-tooltip="GitHub"><FaGithub /></a>
        <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn" data-tooltip="LinkedIn"><FaLinkedin /></a>
        <a href="https://discord.com/" target="_blank" rel="noreferrer" aria-label="Discord" data-tooltip="Discord"><FaDiscord /></a>
        <a href="https://youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube" data-tooltip="YouTube"><FaYoutube /></a>
        <a href="https://www.facebook.com/halapitankkofficial" target="_blank" rel="noreferrer" aria-label="Facebook" data-tooltip="Facebook"><FaFacebook /></a>
        <a href="mailto:proilan@example.com" aria-label="Email" data-tooltip="Email"><Mail /></a>
        <a href="/resume.pdf" download aria-label="Resume" data-tooltip="Resume"><FileText /></a>
      </aside>
      <aside className="sidebar">
        <a className="brand" href="#home" aria-label="Back to home">
          <span className="brand-mark" aria-hidden="true">&lt;/&gt;</span>
          <span className="brand-name">proilan adolfo</span>
        </a>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map(([id, label], index) => (
            <a
              className={activeSection === id ? "active" : ""}
              href={`#${id}`}
              key={id}
              onClick={() => setActiveSection(id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span><b>{label}</b>
            </a>
          ))}
        </nav>
      </aside>
      <button
        type="button"
        className="theme-toggle"
        aria-label="Dark mode"
        aria-pressed={selectedDarkMode}
        title={`Switch to ${selectedDarkMode ? "light" : "dark"} theme`}
        onClick={() => setSelectedDarkMode((current) => !current)}
      >
        <span className="theme-toggle-preview" aria-hidden="true">
          <video
            ref={themeVideoRef}
            src="/Theme/video.mp4"
            muted
            playsInline
            preload="auto"
          />
        </span>
        <span className="theme-toggle-controls" aria-hidden="true">
          <span className="theme-toggle-thumb" />
          <Sun className="theme-toggle-sun" />
          <Moon className="theme-toggle-moon" />
        </span>
      </button>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.map(([id, label], index) => (
          <a
            className={activeSection === id ? "active" : ""}
            href={`#${id}`}
            key={id}
            onClick={() => setActiveSection(id)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span> {label}
          </a>
        ))}
      </nav>
      <nav className={`mobile-socials ${mobileSocialOpen ? "mobile-socials-open" : ""}`} aria-label="Mobile social links">
        <a href="https://github.com/" target="_blank" rel="noreferrer" aria-label="GitHub"><FaGithub /></a>
        <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><FaLinkedin /></a>
        <a href="https://discord.com/" target="_blank" rel="noreferrer" aria-label="Discord"><FaDiscord /></a>
        <a href="https://youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube"><FaYoutube /></a>
        <a href="https://facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook"><FaFacebook /></a>
        <a href="mailto:proilan@example.com" aria-label="Email"><Mail /></a>
        <a href="/resume.pdf" download aria-label="Resume"><FileText /></a>
      </nav>
      <Hero mobileSocialOpen={mobileSocialOpen} onMobileSocialToggle={() => setMobileSocialOpen((current) => !current)} />
    </main>
  );
}
