import useSWR from "swr";

export type Outage = {
  resource_id: number;
  name: string;
  category: string;
  notes: string;
  // null when the machine is locked but Fabman has no disable log for it
  date_start: string | null;
  date_end: string | null;
  hours: number | null;
  sla_hours: number;
  sla_breached: boolean | null;
};

export type MachineStatus = {
  date: string;
  tracking_since: string | null;
  default_sla_hours: number;
  machines: number;
  current: Outage[];
  recent: Outage[];
};

export function useMachineStatus() {
  return useSWR<MachineStatus | null>(
    "/api/metrics/machine_status",
    (url: string) => fetch(url).then((res) => res.json()),
  );
}

export function formatDuration(hours: number | null) {
  if (hours == null) return "–";
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${(hours / 24).toLocaleString("cs", { maximumFractionDigits: 1 })} dne`;
}
