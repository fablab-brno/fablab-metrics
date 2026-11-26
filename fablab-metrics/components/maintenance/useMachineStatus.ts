import useSWR from "swr";

export type Outage = {
  resource_id: number;
  name: string;
  category: string;
  notes: string;
  date_start: string;
  date_end: string | null;
  hours: number;
  sla_hours: number;
  sla_breached: boolean;
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

export function formatDuration(hours: number) {
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${(hours / 24).toLocaleString("cs", { maximumFractionDigits: 1 })} dne`;
}
