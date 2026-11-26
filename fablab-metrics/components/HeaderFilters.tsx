"use client";

import { DateRangeDropdown } from "fablab-metrics/ui/DateRangeDropdown";
import { DateZoomSelector } from "fablab-metrics/ui/DateZoomSelector";
import { MemberPackagesDropdown } from "fablab-metrics/ui/MemberPackagesDropdown";
import { usePathname } from "next/navigation";

export function HeaderFilters() {
  const pathname = usePathname();

  // The membership filter only affects charts on the overview tab.
  const showPackages = pathname === "/";

  return (
    <div className="justify-self-center flex items-center gap-4">
      <DateZoomSelector />
      <DateRangeDropdown />
      {showPackages && <MemberPackagesDropdown />}
    </div>
  );
}
