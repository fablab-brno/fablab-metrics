import { ReactNode } from "react";

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-lg font-bold mt-6 mb-4 flex gap-4 items-center">
      {children}
    </h2>
  );
}
