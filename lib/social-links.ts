export type ElsewhereLink = {
  label: string;
  href: string;
  external: boolean;
  glyph: string;
};

export const ELSEWHERE: ElsewhereLink[] = [
  { label: "LinkedIn",  href: "https://linkedin.com/in/akshita25/",                                       external: true,  glyph: "in" },
  { label: "Behance",   href: "https://behance.net/akshitasingh",                                         external: true,  glyph: "Bē" },
  { label: "Dribbble",  href: "https://dribbble.com/akshitasingh",                                        external: true,  glyph: "Db" },
  { label: "Email",     href: "mailto:akshitasingh094@gmail.com",                                         external: false, glyph: "@"  },
  { label: "Resume",    href: "https://drive.google.com/file/d/1R96hpdb73wixPa-Y9g2H67VGIILFhEhk/view",  external: true,  glyph: "CV" },
];

export const RESUME_LINK = ELSEWHERE.find(l => l.label === "Resume")!;
