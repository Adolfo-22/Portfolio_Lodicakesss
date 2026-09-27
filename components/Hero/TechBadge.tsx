import type { CSSProperties } from "react";
import type { TechBadge as TechBadgeType } from "@/data/profile";
import styles from "./TechBadge.module.css";

export default function TechBadge({ label, shortLabel, color }: TechBadgeType) {
  return (
    <li className={styles.badge}>
      <span
        className={styles.icon}
        style={{ "--badge-color": color } as CSSProperties}
        aria-hidden="true"
      >
        {shortLabel}
      </span>
      <span className={styles.label}>{label}</span>
    </li>
  );
}
