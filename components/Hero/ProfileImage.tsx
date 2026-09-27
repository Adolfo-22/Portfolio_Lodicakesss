"use client";

import { useEffect, useState } from "react";
import styles from "./ProfileImage.module.css";

type ProfileImageProps = {
  src: string;
  name: string;
};

export default function ProfileImage({ src, name }: ProfileImageProps) {
  const images = [
    { src: "/profile-1.jpg", alt: `${name} portrait` },
    { src: "/profile-2.jpg", alt: `${name} outdoors` },
  ];
  const [current, setCurrent] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrent((index) => (index + 1) % images.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [images.length]);

  // Mouse hover and touch tap each own the "active" state exclusively.
  // Touch interactions synthesize compatibility mouse events (a
  // mouseenter before the click), so hover handlers are gated to real
  // hover-capable pointers and the click toggle to hover:none devices —
  // otherwise a tap fires both paths and cancels itself out. Keyboard
  // focus is handled purely in CSS (:focus-visible) for the same reason.
  const isHoverCapable = () =>
    typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

  const goTo = (index: number) => setCurrent((index + images.length) % images.length);
  const handleClick = () => {
    if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) setActive((prev) => !prev);
  };

  return (
    <div className={styles.wrap}>
      <div className={`${styles.glow} ${active ? styles.glowActive : ""}`} aria-hidden="true" />
      <button
        type="button"
        className={`${styles.frame} ${active ? styles.frameActive : ""}`}
        onMouseEnter={() => isHoverCapable() && setActive(true)}
        onMouseLeave={() => isHoverCapable() && setActive(false)}
        onClick={handleClick}
        aria-pressed={active}
        aria-label={`${name} — tap to reveal in color`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[current]?.src ?? src} alt={images[current]?.alt ?? `Portrait of ${name}`} className={styles.image} />
      </button>
      <div className={styles.controls} aria-label="Profile image carousel controls">
        <button type="button" className={styles.arrow} onClick={() => goTo(current - 1)} aria-label="Previous profile image">←</button>
        <div className={styles.dots}>
          {images.map((image, index) => <button key={image.src} type="button" className={`${styles.dot} ${index === current ? styles.dotActive : ""}`} onClick={() => goTo(index)} aria-label={`Show profile image ${index + 1}`} aria-current={index === current ? "true" : undefined} />)}
        </div>
        <button type="button" className={styles.arrow} onClick={() => goTo(current + 1)} aria-label="Next profile image">→</button>
      </div>
    </div>
  );
}
