export type TechBadge = {
  label: string;
  shortLabel: string;
  color: string;
};

export const profile = {
  name: "Proilan M. Adolfo",
  displayName: "Proilan Adolfo",
  location: "San Fernando, Bukidnon",
  email: "adolfoproilan@gmail.com",
  phone: { label: "+63 951 884 1563", href: "tel:+639518841563" },
  initials: "PA",
  role: "BSIT 4th Year Student, Bukidnon State University",
  focus: "Full-Stack Web Development",
  headingLines: ["Hi, I'm Proilan", "I build things for the web"],
  bio: [
    "I'm a 4th-year BSIT student at Bukidnon State University who likes turning rough ideas into ",
    { text: "clean, working software", emphasis: true },
    ". I care about ",
    { text: "readable code", emphasis: true },
    " and ",
    { text: "attention to detail", emphasis: true },
    " as much as I care about shipping something that actually works.",
  ],
  ctas: {
    primary: { label: "View My Work", href: "#projects" },
    secondary: { label: "Download Resume", href: "/resume.pdf" },
  },
  avatar: "/avatar-placeholder.svg",
} as const;

export type Strategy = {
  title: string;
  description: string;
};

export type BlogReaction = "like" | "love" | "celebrate";

export type BlogPost = {
  id: string;
  title: string;
  date: string;
  caption: string;
  demoReactions: Record<BlogReaction, number>;
  mainImage: { src: string; alt: string };
  thumbImages: { src: string; alt: string }[];
};

export const blogPosts: BlogPost[] = [
  {
    id: "capstone-defense",
    title: "Capstone 2 Defended",
    date: "November 2026 · milestone",
    demoReactions: { like: 24, love: 18, celebrate: 12 },
    caption:
      "Our capstone, \"IoT-Powered Attendance Monitoring with Geotagging and Geolocation to Address Student Truancy,\" officially passed its final defense. Months of building, debugging, and revising the RFID, GPS, and SMS-notification pipeline came down to this panel presentation, and the system held up. Grateful to my groupmates, Estrada, Sales, and Toregossa, and to our panelists and adviser for the guidance that got us here.",
    mainImage: {
      src: "/blog/Def-1.jpg",
      alt: "Proilan and groupmates holding a laptop showing \"SYSTEM DEFENDED!\" in front of the Bukidnon State University Research and Extension Building",
    },
    thumbImages: [
      {
        src: "/blog/Def-2.jpg",
        alt: "The team giving a thumbs up after presenting the capstone on the classroom screen",
      },
      {
        src: "/blog/Def-3.jpg",
        alt: "The full defense panel, adviser, and student team posing together after the defense",
      },
      {
        src: "/blog/Def4.jpg",
        alt: "Another group photo with panelists and faculty after the capstone defense",
      },
    ],
  },
  {
    id: "battle-of-the-band",
    title: "Battle of the Band Champion",
    date: "September 2026 · achievement",
    demoReactions: { like: 31, love: 16, celebrate: 21 },
    caption:
      "A memorable night of music, teamwork, and hard work. Proud to share that our band became the Battle of the Band Champion, and I was also recognized as Best in Keyboard. This experience reminded me that preparation, collaboration, and passion can turn every performance into something meaningful.",
    mainImage: {
      src: "/blog/battle-2.JPG",
      alt: "Proilan receiving the Best in Keyboard recognition",
    },
    thumbImages: [
      { src: "/blog/battle-1.JPG", alt: "Battle of the Band group photo" },
      { src: "/blog/battle-3.JPG", alt: "Proilan performing on keyboard" },
      { src: "/blog/battle-4.JPG", alt: "Best in Keyboard award photo" },
    ],
  },
];

export const strategies: Strategy[] = [
  {
    title: "clarity first",
    description: "I write readable code and document decisions so anyone, including future me, can pick up a project without guesswork.",
  },
  {
    title: "ship, then refine",
    description: "I get a working version out early, gather real feedback, and iterate instead of chasing a perfect first draft.",
  },
  {
    title: "user-centered",
    description: "Features get built around what people actually need, whether it's parents tracking attendance or clinic staff logging patient care.",
  },
  {
    title: "learning in public",
    description: "As a BSIT student, I treat every capstone and side project as a chance to document mistakes and lessons, not just ship features.",
  },
  {
    title: "small, testable pieces",
    description: "I break a big system into smaller modules I can run and test on their own, like separating the RFID scanner from the notification service, so bugs are easier to isolate.",
  },
  {
    title: "communication over guesswork",
    description: "Before writing code for a group project or client request, I confirm requirements and edge cases out loud so the whole team builds the same thing.",
  },
];

export const techStack: TechBadge[] = [
  { label: "HTML5", shortLabel: "H5", color: "#e34f26" },
  { label: "CSS3", shortLabel: "C3", color: "#2965f1" },
  { label: "JavaScript", shortLabel: "JS", color: "#e8b923" },
  { label: "React", shortLabel: "Rx", color: "#61dafb" },
  { label: "Next.js", shortLabel: "N.", color: "#8a8a94" },
  { label: "Node.js", shortLabel: "Nd", color: "#3c873a" },
  { label: "Python", shortLabel: "Py", color: "#3776ab" },
  { label: "Git", shortLabel: "Gt", color: "#f05033" },
];
