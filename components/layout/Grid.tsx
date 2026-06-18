import { ElementType, ReactNode } from "react";

type Cols = 4 | 8 | 12;

const colsMap: Record<Cols, string> = {
  4: "md:grid-cols-4",
  8: "md:grid-cols-8",
  12: "md:grid-cols-12",
};

type Props = {
  as?: ElementType;
  cols?: Cols;
  className?: string;
  children: ReactNode;
};

export default function Grid({ as: Tag = "div", cols = 12, className, children }: Props) {
  return (
    <Tag
      className={`grid grid-cols-4 ${colsMap[cols]} gap-8 md:gap-12${className ? ` ${className}` : ""}`}
    >
      {children}
    </Tag>
  );
}
