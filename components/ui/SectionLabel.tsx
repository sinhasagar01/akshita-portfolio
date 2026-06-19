import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function SectionLabel({ children, className }: Props) {
  return (
    <p
      className={`text-eyebrow tracking-eyebrow uppercase text-[--color-text-muted]${className ? ` ${className}` : ""}`}
    >
      {children}
    </p>
  );
}
