import type { IconType } from 'react-icons';
import { SiHtml5, SiJavascript, SiReact, SiNextdotjs, SiNodedotjs, SiPython, SiGit } from 'react-icons/si';
import { FaCss3Alt } from 'react-icons/fa6';
import { techStack } from '@/data/profile';
import styles from './SidebarTechStack.module.css';

const icons: Record<string, IconType> = {
  HTML5: SiHtml5, CSS3: FaCss3Alt, JavaScript: SiJavascript, React: SiReact,
  'Next.js': SiNextdotjs, 'Node.js': SiNodedotjs, Python: SiPython, Git: SiGit,
};

export default function SidebarTechStack() {
  return <section className={styles.stack} aria-label="My tech stack">
    <h2>My toolkit</h2>
    <p>Tools I build with</p>
    <ul>{techStack.map(tech => {
      const Icon = icons[tech.label];
      return <li key={tech.label}>{Icon && <Icon aria-hidden="true" />}<span>{tech.label}</span></li>;
    })}</ul>
  </section>;
}
