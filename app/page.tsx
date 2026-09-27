"use client";

import { useEffect, useRef, useState } from "react";
import Hero from "@/components/Hero/Hero";
import MobileNavigation from "@/components/MobileNavigation";
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

// Both video versions retain the first dark frame at 3.208333 seconds.
const THEME_SWITCH_TIME = 3.208333;
const THEME_FRAME_DURATION = 1 / 24;

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedDarkMode, setSelectedDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const themeVideoRef = useRef<HTMLVideoElement>(null);
  const themeCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
  }, [darkMode]);

  // Follow the displayed video frame in either direction, including seeks
  // and pauses. The theme must not run on a separate click countdown.
  useEffect(() => {
    const video = themeVideoRef.current;
    if (!video) return;
    const canvas = themeCanvasRef.current;
    const context = canvas?.getContext("2d");
    let lastFrameDark: boolean | null = null;

    const syncTheme = (mediaTime: number) => {
      const frameDark = mediaTime >= THEME_SWITCH_TIME;
      if (frameDark === lastFrameDark) return;
      lastFrameDark = frameDark;
      // Apply the colors during the frame callback, before React's next render.
      document.documentElement.dataset.theme = frameDark ? "dark" : "light";
      setDarkMode(frameDark);
    };

    // Keep the last decoded frame on screen while mobile browsers buffer or
    // seek. The native video surface can briefly clear during those operations.
    const presentFrame = (mediaTime: number) => {
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.seeking) return;
      if (canvas && context) context.drawImage(video, 0, 0, canvas.width, canvas.height);
      syncTheme(mediaTime);
    };
    const syncCurrentFrame = () => presentFrame(video.currentTime);
    video.addEventListener("loadeddata", syncCurrentFrame);
    video.addEventListener("seeked", syncCurrentFrame);
    syncCurrentFrame();

    let frameCallback = 0;
    let animationFrame = 0;
    const hasVideoFrames = typeof video.requestVideoFrameCallback === "function";
    if (typeof video.requestVideoFrameCallback === "function") {
      const onVideoFrame: VideoFrameRequestCallback = (_now, metadata) => {
        presentFrame(metadata.mediaTime);
        frameCallback = video.requestVideoFrameCallback(onVideoFrame);
      };
      frameCallback = video.requestVideoFrameCallback(onVideoFrame);
    }

    // timeupdate alone is too infrequent for smooth rendering on older WebKit.
    const animatePlayback = () => {
      syncCurrentFrame();
      if (!video.paused && !video.ended) animationFrame = requestAnimationFrame(animatePlayback);
    };
    const onPlay = () => {
      if (hasVideoFrames) return;
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(animatePlayback);
    };
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", syncCurrentFrame);
    video.addEventListener("ended", syncCurrentFrame);
    if (!video.paused) onPlay();
    return () => {
      if (hasVideoFrames) video.cancelVideoFrameCallback(frameCallback);
      cancelAnimationFrame(animationFrame);
      video.removeEventListener("loadeddata", syncCurrentFrame);
      video.removeEventListener("seeked", syncCurrentFrame);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", syncCurrentFrame);
      video.removeEventListener("ended", syncCurrentFrame);
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
      const lastFrameTime = Math.max(0, video.duration - THEME_FRAME_DURATION);

      const advance = (timestamp: number) => {
        if (cancelled) return;
        const elapsed = (timestamp - startedAt) / 1000;
        const target = Math.min(lastFrameTime, Math.max(0, start + direction * elapsed));
        const reachedEnd = direction === 1 ? target === lastFrameTime : target === 0;

        if (!video.seeking && (Math.abs(video.currentTime - target) >= THEME_FRAME_DURATION || reachedEnd)) {
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
        // Seeking to duration can restore the poster in WebKit. Stay on the
        // final decodable frame instead of seeking beyond the last frame.
        video.currentTime = selectedDarkMode ? Math.max(0, duration - THEME_FRAME_DURATION) : 0;
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
        <a href="/resume/Adolfo_Resume.pdf" target="_blank" rel="noopener noreferrer" aria-label="Resume (opens in a new tab)" data-tooltip="Resume"><FileText /></a>
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
      <MobileNavigation
        navigation={navigation}
        activeSection={activeSection}
        onNavigate={setActiveSection}
        selectedDarkMode={selectedDarkMode}
        onThemeToggle={() => setSelectedDarkMode((current) => !current)}
      >
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
              src="/Theme/video-preview.mp4"
              poster="/Theme/day-poster.webp"
              muted
              playsInline
              preload="auto"
            />
            <canvas ref={themeCanvasRef} width={512} height={512} />
          </span>
          <span className="theme-toggle-controls" aria-hidden="true">
            <span className="theme-toggle-thumb" />
            <Sun className="theme-toggle-sun" />
            <Moon className="theme-toggle-moon" />
          </span>
        </button>
      </MobileNavigation>
      <Hero />
    </main>
  );
}
