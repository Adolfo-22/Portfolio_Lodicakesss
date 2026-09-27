"use client";

import { startTransition, useEffect, useState } from "react";
import { Heart, PartyPopper, ThumbsUp } from "lucide-react";
import type { BlogReaction } from "@/data/profile";
import styles from "./Hero.module.css";

const options = [
  { id: "like", label: "Like", Icon: ThumbsUp },
  { id: "love", label: "Love", Icon: Heart },
  { id: "celebrate", label: "Celebrate", Icon: PartyPopper },
] as const;

type PostReactionsProps = {
  postId: string;
  counts: Record<BlogReaction, number>;
  commentCount: number;
};

export default function PostReactions({ postId, counts, commentCount }: PostReactionsProps) {
  const [selected, setSelected] = useState<BlogReaction | null>(null);
  const storageKey = `portfolio-reaction:${postId}`;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved === "like" || saved === "love" || saved === "celebrate") {
        startTransition(() => setSelected(saved));
      }
    } catch {
      // Reactions still work for this visit when browser storage is unavailable.
    }
  }, [storageKey]);

  const react = (reaction: BlogReaction) => {
    const next = selected === reaction ? null : reaction;
    setSelected(next);
    try {
      if (next) window.localStorage.setItem(storageKey, next);
      else window.localStorage.removeItem(storageKey);
    } catch {
      // Keep the in-memory selection when storage is blocked or full.
    }
  };

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0) + (selected ? 1 : 0);

  return (
    <>
      <div className={styles.postMeta}>
        <span className={styles.reactionSummary}><span aria-hidden="true">👍 ❤️ 🎉</span><span>{total} demo reactions</span></span>
        <span>{commentCount} {commentCount === 1 ? "comment" : "comments"}</span>
      </div>
      <div className={styles.reactionBar} role="group" aria-label="Post reactions — your choice is saved on this device">
        {options.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`${styles.reactionButton} ${selected === id ? styles.reactionSelected : ""}`}
            data-reaction={id}
            aria-pressed={selected === id}
            onClick={() => react(id)}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
            <b>{counts[id] + (selected === id ? 1 : 0)}</b>
          </button>
        ))}
      </div>
    </>
  );
}
