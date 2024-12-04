"use client";

import { useStatus } from "fablab-metrics/ui/useStatus";

export function MembersWithoutPackage() {
  const status = useStatus();

  return status.data?.members_without_package ?? " ";
}
