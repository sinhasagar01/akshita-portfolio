import { ElementType, ReactNode } from "react";

type Props = {
  as?: ElementType;
  id?: string;
  className?: string;
  children: ReactNode;
};

export default function SectionWrapper({ as: Tag = "section", id, className, children }: Props) {
  return (
    <Tag id={id} className={`py-section section-card${className ? ` ${className}` : ""}`}>
      {children}
    </Tag>
  );
}
