"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { blogPosts, certifications, profile, strategies, techStack } from "@/data/profile";
import Image from "next/image";
import PrivatePostButton from "./PrivatePostButton";
import { LockKeyhole, Heart, MessageCircle, Send } from "lucide-react";
import ProfileImage from "./ProfileImage";
import PostReactions from "./PostReactions";
import TechBadge from "./TechBadge";
import CertificateViewer from "./CertificateViewer";
import styles from "./Hero.module.css";

const carouselPosts = [
  ...blogPosts,
  { id: "just-us-private", title: "Just us", private: true as const },
];

export default function Hero() {
  const [projectOpen, setProjectOpen] = useState<"attendance" | "carenest" | null>(null);
  const [postComments, setPostComments] = useState<Record<string, string[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [viewerImage, setViewerImage] = useState<{ src: string; alt: string } | null>(null);
  const [activePost, setActivePost] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [privatePostOpen, setPrivatePostOpen] = useState(false);
  const blogViewportRef = useRef<HTMLDivElement>(null);
  const activePostRef = useRef(0);

  const goToPost = useCallback((index: number) => {
    const viewport = blogViewportRef.current;
    if (!viewport || carouselPosts.length === 0) return;
    const next = (index + carouselPosts.length) % carouselPosts.length;
    viewport.scrollTo({
      left: next * viewport.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }, []);

  useEffect(() => {
    // Touch devices stay manual even when rotated past the mobile breakpoint.
    const manualCarousel = window.matchMedia("(max-width: 900px), (pointer: coarse)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: number | undefined;
    const updateAutoplay = () => {
      window.clearInterval(timer);
      if (carouselPaused || privatePostOpen || viewerImage || carouselPosts.length <= 1 || manualCarousel.matches || reducedMotion.matches || document.hidden) return;
      timer = window.setInterval(() => goToPost(activePostRef.current + 1), 2000);
    };
    updateAutoplay();
    manualCarousel.addEventListener("change", updateAutoplay);
    reducedMotion.addEventListener("change", updateAutoplay);
    document.addEventListener("visibilitychange", updateAutoplay);
    return () => {
      window.clearInterval(timer);
      manualCarousel.removeEventListener("change", updateAutoplay);
      reducedMotion.removeEventListener("change", updateAutoplay);
      document.removeEventListener("visibilitychange", updateAutoplay);
    };
  }, [carouselPaused, privatePostOpen, viewerImage, goToPost]);

  useEffect(() => {
    const viewport = blogViewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(() => {
      viewport.scrollTo({ left: activePostRef.current * viewport.clientWidth, behavior: "instant" });
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!projectOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProjectOpen(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [projectOpen]);

  useEffect(() => {
    if (!viewerImage) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setViewerImage(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [viewerImage]);

  useEffect(() => {
    try {
      const savedComments = window.localStorage.getItem("portfolio-post-comments");
      const parsed: unknown = savedComments ? JSON.parse(savedComments) : null;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const comments = Object.fromEntries(Object.entries(parsed).filter(([, value]) => Array.isArray(value) && value.every((comment) => typeof comment === "string")));
        startTransition(() => setPostComments(comments));
      }
    } catch {
      // The blog remains interactive when local storage is unavailable.
    }
  }, []);

  const submitComment = (postId: string) => (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedComment = (commentDrafts[postId] ?? "").trim();
    if (!trimmedComment) return;
    const nextComments = { ...postComments, [postId]: [...(postComments[postId] ?? []), trimmedComment] };
    setPostComments(nextComments);
    try {
      window.localStorage.setItem("portfolio-post-comments", JSON.stringify(nextComments));
    } catch {
      // Keep comments available for the current visit if saving is blocked.
    }
    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
  };

  return (
    <div className={styles.pageContent}>
      <section id="home" className={styles.hero} aria-label="Introduction">
        <div className={styles.inner}>
          <div className={styles.imageColumn}><ProfileImage src={profile.avatar} name={profile.name} /></div>
          <div className={styles.content}>
            <p className={styles.kicker}>full-stack engineer · student</p>
            <h1 className={styles.heading}>proilan<br />adolfo</h1>
            <p className={styles.lede}>I&apos;m a full-stack engineer who builds modern web and mobile applications, with a growing focus on generative AI.</p>
            <p className={styles.bio}>I enjoy turning early-stage ideas into practical, user-friendly products. Whether I&apos;m building from scratch or improving an existing system, my goal is to create technology that people can genuinely use and value.</p>
            <div className={styles.ctas}><a href="#contact" className={styles.primaryBtn}>let&apos;s talk <span>↗</span></a><a href="#projects" className={styles.secondaryBtn}>view projects <span>↓</span></a></div>
          </div>
        </div>
      </section>
      <section id="projects" className={styles.section}><div className={styles.sectionHead}><span>01 — projects</span><a href="#contact">view all →</a></div><article className={styles.feature}><button type="button" className={styles.projectImage} onClick={() => setProjectOpen("attendance")} aria-label="Open Student Gate Attendance project details"><Image src="/attendance-preview.svg" alt="Student Gate Attendance project preview" fill loading="eager" sizes="(max-width: 620px) 100vw, (max-width: 900px) 45vw, 320px" /></button><div className={styles.projectInfo}><span className={styles.date}>featured work · IoT / geolocation</span><h2>student gate attendance</h2><p>Built with Flutter, Node.js, React.js, and MongoDB, with Raspberry Pi powering the gate-side attendance server.</p><div className={styles.projectTags}><span>Flutter</span><span>Node.js</span><span>React.js</span><span>MongoDB</span><span>Raspberry Pi</span></div></div><span className={styles.arrow}>↗</span></article><article className={`${styles.feature} ${styles.reverseFeature}`}><button type="button" className={styles.projectImage} onClick={() => setProjectOpen("carenest")} aria-label="Open CareNest project details"><Image src="/carenest-preview.svg" alt="CareNest project preview" fill sizes="(max-width: 620px) 100vw, (max-width: 900px) 45vw, 320px" /></button><div className={styles.projectInfo}><span className={styles.date}>project 02 · maternal care platform</span><h2>CareNest</h2><p>A multi-tenant platform that modernizes lying-in clinic operations, prenatal care, appointments, delivery records, and maternal health data.</p><div className={styles.projectTags}><span>PHP</span><span>Laravel</span><span>Multi-tenant</span></div></div><span className={styles.arrow}>↗</span></article></section>
      {projectOpen && <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setProjectOpen(null); }}><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="project-modal-title"><button type="button" className={styles.modalClose} onClick={() => setProjectOpen(null)} aria-label="Close project details">×</button>{projectOpen === "attendance" ? <><span className={styles.date}>project 01 · capstone system</span><h2 id="project-modal-title">IoT-powered attendance monitoring with geotagging and geolocation</h2><p>The system automates and improves student attendance monitoring through RFID scanning, GPS/geolocation validation, and an IoT-based setup that records attendance and timestamps in real time.</p><p>It also sends SMS notifications to parents or guardians when students enter or leave the school premises, while authorized users can monitor attendance and student location through the system.</p><div className={styles.modalGrid}><div><span className={styles.modalLabel}>short version for defense</span><p>Our capstone uses RFID, GPS/geolocation, and SMS notifications for reliable real-time attendance monitoring and better communication between schools and parents.</p></div><div><span className={styles.modalLabel}>system stack</span><div className={styles.projectTags}><span>Flutter</span><span>React.js</span><span>Node.js</span><span>MongoDB</span><span>Raspberry Pi</span></div></div></div></> : <><span className={styles.date}>project 02 · maternal care platform</span><h2 id="project-modal-title">CareNest</h2><p>CareNest is a multi-tenant digital platform designed to modernize and streamline the operations of lying-in clinics. It enables efficient management of prenatal care, appointments, delivery records, and maternal health data through a centralized yet secure system.</p><p>A lying-in clinic provides prenatal care, childbirth assistance, and postnatal care. CareNest replaces manual logbooks and scattered social media messaging with organized digital workflows, reducing data loss, scheduling conflicts, and gaps in patient monitoring.</p><div className={styles.modalGrid}><div><span className={styles.modalLabel}>system purpose</span><p>Multiple clinics can operate independently while managing their own patients, schedules, records, and maternal healthcare processes in one secure platform.</p></div><div><span className={styles.modalLabel}>system stack</span><div className={styles.projectTags}><span>PHP</span><span>Laravel</span><span>Multi-tenant</span></div></div></div></>}</section></div>}
      <section id="writing" className={styles.section}>
        <div className={styles.sectionHead}><span>02 — blog</span><span>personal updates</span></div>
        <div className={styles.swipeHint}><span>↔ Swipe to browse</span><span>{activePost + 1} / {carouselPosts.length}</span></div>
        <div
          className={styles.blogCarousel}
          role="region"
          aria-roledescription="carousel"
          aria-label="Blog posts"
          onMouseEnter={() => setCarouselPaused(true)}
          onMouseLeave={() => setCarouselPaused(false)}
          onFocus={() => setCarouselPaused(true)}
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setCarouselPaused(false); }}
        >
          <div
            ref={blogViewportRef}
            className={styles.blogViewport}
            onScroll={(event) => {
              const viewport = event.currentTarget;
              if (!viewport.clientWidth) return;
              const next = Math.max(0, Math.min(carouselPosts.length - 1, Math.round(viewport.scrollLeft / viewport.clientWidth)));
              activePostRef.current = next;
              setActivePost(next);
            }}
          >
            <div className={styles.blogTrack}>
              {carouselPosts.map((post, slideIndex) => {
                if ("private" in post) return (
                  <div className={styles.blogSlide} key={post.id} role="group" aria-roledescription="slide" aria-label={`${slideIndex + 1} of ${carouselPosts.length}`} aria-hidden={slideIndex !== activePost} inert={slideIndex !== activePost}>
                    <article className={styles.blogPost}>
                      <header className={styles.postHeader}><div className={styles.postAvatar}>PA</div><div><h2>{post.title}</h2><span className={styles.date}>personal moments · private post</span></div><LockKeyhole size={18} aria-label="Private post" /></header>
                      <p className={styles.postCaption}>A collection of our favorite moments together. Some memories are just for us.</p>
                      <div className={styles.lockedPost}>
                        <div className={styles.lockedPostIcon}><Heart size={36} aria-hidden="true" /></div>
                        <h3>Our little moments.</h3>
                        <p>This post is password protected.</p>
                        <PrivatePostButton onOpenChange={setPrivatePostOpen} />
                        <small>Enter the password to view the photos.</small>
                      </div>
                    </article>
                  </div>
                );
                const comments = postComments[post.id] ?? [];
                return (
                  <div className={styles.blogSlide} key={post.id} role="group" aria-roledescription="slide" aria-label={`${slideIndex + 1} of ${carouselPosts.length}`} aria-hidden={slideIndex !== activePost} inert={slideIndex !== activePost}>
                    <article className={styles.blogPost}><header className={styles.postHeader}><div className={styles.postAvatar}>PA</div><div><h2>{post.title}</h2><span className={styles.date}>{post.date}</span></div><span className={styles.postMenu}>•••</span></header><p className={styles.postCaption}>{post.caption}</p><div className={styles.postGallery}><button type="button" className={styles.galleryMain} onClick={() => setViewerImage(post.mainImage)} aria-label={`View ${post.mainImage.alt}`}><Image src={post.mainImage.src} alt={post.mainImage.alt} fill sizes="(max-width: 620px) 100vw, 66vw" /></button><div className={styles.gallerySide}>{post.thumbImages.map((thumb) => <button type="button" className={styles.galleryThumb} key={thumb.src} onClick={() => setViewerImage(thumb)} aria-label={`View ${thumb.alt}`}><Image src={thumb.src} alt={thumb.alt} fill sizes="(max-width: 620px) 50vw, 33vw" /></button>)}</div></div><PostReactions postId={post.id} counts={post.demoReactions} commentCount={comments.length} /><div className={styles.postActions}><button type="button" onClick={() => document.getElementById(`comment-input-${post.id}`)?.focus()}><MessageCircle /> Comment</button><button type="button"><Send /> Share</button></div><div className={styles.comments}>{comments.map((item, index) => <p key={`${item}-${index}`}><strong>Visitor</strong>{item}</p>)}</div><form className={styles.commentForm} onSubmit={submitComment(post.id)}><input id={`comment-input-${post.id}`} value={commentDrafts[post.id] ?? ""} onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))} placeholder="Write a comment..." aria-label="Write a comment" maxLength={240} /><button type="submit" aria-label="Post comment"><Send /></button></form></article>
                  </div>
                );
              })}
            </div>
          </div>
          {carouselPosts.length > 1 && (
            <>
              <button type="button" className={`${styles.carouselArrow} ${styles.carouselArrowLeft}`} onClick={() => goToPost(activePost - 1)} aria-label="Previous blog post">←</button>
              <button type="button" className={`${styles.carouselArrow} ${styles.carouselArrowRight}`} onClick={() => goToPost(activePost + 1)} aria-label="Next blog post">→</button>
              <div className={styles.carouselDots}>
                {carouselPosts.map((post, index) => <button key={post.id} type="button" className={`${styles.carouselDot} ${index === activePost ? styles.carouselDotActive : ""}`} onClick={() => goToPost(index)} aria-label={`Show post ${index + 1}: ${post.title}`} aria-current={index === activePost ? "true" : undefined} />)}
              </div>
            </>
          )}
        </div>
      </section>
      {viewerImage && <div className={styles.imageViewer} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setViewerImage(null); }}><div className={styles.viewerContent} role="dialog" aria-modal="true" aria-label="Full size blog image"><button type="button" className={styles.viewerClose} onClick={() => setViewerImage(null)} aria-label="Close image viewer">×</button><Image src={viewerImage.src} alt={viewerImage.alt} width={1400} height={1800} className={styles.viewerImage} /></div></div>}
      <section id="about" className={styles.section}><div className={styles.sectionHead}><span>03 — about</span><span>experience &amp; approach</span></div><p className={styles.aboutText}>I&apos;m currently finishing my BSIT degree at Bukidnon State University, learning in public and building with a bias toward clarity, usefulness, and steady improvement.</p><p className={styles.strategyLead}>Here&apos;s how that shows up in the way I plan, build, and ship projects, from classroom requirements to full capstone systems:</p><ul className={styles.strategyGrid}>{strategies.map((strategy, index) => <li key={strategy.title} className={styles.strategyCard}><span className={styles.strategyIndex}>{String(index + 1).padStart(2, "0")}</span><h3>{strategy.title}</h3><p>{strategy.description}</p></li>)}</ul><p className={styles.strategyNote}>Right now I&apos;m applying these habits while finishing my BSIT capstone and picking up more backend and AI-assisted tooling, so I can carry them into my first professional role.</p></section>
      <section id="experience" className={styles.section} aria-labelledby="experience-title">
        <div className={styles.sectionHead}><span>04 — experience</span><span>training &amp; certifications</span></div>
        <h2 id="experience-title" className={styles.experienceTitle}>Learning, backed by practice.</h2>
        <p className={styles.experienceIntro}>Training in networking and computer systems, with certificates earned through Cisco Networking Academy and TESDA.</p>
        <div className={styles.certificateList}>{certifications.map((certificate, index) => <article className={styles.certificateCard} key={certificate.title}>
          <span className={styles.certificateNumber}>{String(index + 1).padStart(2, "0")}</span>
          <div><span className={styles.date}>{certificate.kind}</span><h3>{certificate.title}</h3><p className={styles.certificateIssuer}>{certificate.issuer}</p><p>{certificate.description}</p>{certificate.date && <p className={styles.certificateDate}>{certificate.date}</p>}<CertificateViewer certificate={certificate} /></div>
        </article>)}</div>
      </section>
      <section id="stack" className={styles.stackSection}><div className={styles.sectionHead}><span>04 — stack</span><span id="education">tools i reach for</span></div><ul className={styles.badges}>{techStack.map((tech) => <TechBadge key={tech.label} {...tech} />)}</ul></section>
      <footer id="contact" className={styles.footer}><span>have an idea?</span><a href="mailto:proilan@example.com">proilan@example.com ↗</a></footer>
    </div>
  );
}
