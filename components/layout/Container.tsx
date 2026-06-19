import { ElementType, ReactNode } from "react";

type Props = {
  as?: ElementType;
  className?: string;
  children: ReactNode;
};

export default function Container({ as: Tag = "div", className, children }: Props) {
  return (
    <Tag className={`max-w-[72rem] mx-auto px-[--spacing-content]${className ? ` ${className}` : ""}`}>
      {children}
    </Tag>
  );
}
