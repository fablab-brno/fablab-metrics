import classnames from "classnames";
import { ReactNode } from "react";

export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "neutral" | "good" | "bad";
}) {
  return (
    <div className="rounded border border-gray-200 p-4">
      <div className="text-xs uppercase font-bold text-gray-500">{label}</div>
      <div
        className={classnames("text-3xl font-bold mt-1 tabular-nums", {
          "text-green-700": tone === "good",
          "text-red-600": tone === "bad",
        })}
      >
        {value}
      </div>
      {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
    </div>
  );
}
