"use client";

import classnames from "classnames";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const tabs = [
  { href: "/", label: "Přehled" },
  { href: "/udrzba", label: "Údržba strojů" },
  { href: "/marketing", label: "Marketing" },
];

export function Tabs() {
  const pathname = usePathname();

  return (
    <nav className="container mx-auto flex gap-2" aria-label="Záložky">
      {tabs.map((tab) => {
        const active =
          tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={classnames(
              "px-4 py-2 text-sm font-semibold rounded-t transition-colors",
              {
                "bg-red-500 text-white": active,
                "text-gray-600 hover:bg-red-50 hover:text-red-600": !active,
              },
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
