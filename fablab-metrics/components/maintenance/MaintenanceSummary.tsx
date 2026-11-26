"use client";

import { StatTile } from "fablab-metrics/components/maintenance/StatTile";
import {
  formatDuration,
  useMachineStatus,
} from "fablab-metrics/components/maintenance/useMachineStatus";
import { useMetrics } from "fablab-metrics/components/useMetrics";

/** Headline numbers: current state + totals for the selected date range. */
export function MaintenanceSummary() {
  const status = useMachineStatus();
  const metrics = useMetrics("machine_downtime");

  if (status.isLoading || metrics.isLoading) return null;

  const s = status.data;
  const rows: any[] = metrics.data ?? [];

  if (!s || !s.tracking_since) {
    return (
      <p className="text-sm text-gray-600">
        Zatím nejsou k dispozici žádná data o stavu strojů. Sledování začne při
        příštím běhu dataloaderu.
      </p>
    );
  }

  const breached = s.current.filter((o) => o.sla_breached).length;

  const observed = rows.reduce((acc, r) => acc + r.observed_hours, 0);
  const downtime = rows.reduce((acc, r) => acc + r.downtime_hours, 0);
  const resolved = rows.reduce((acc, r) => acc + r.outages_resolved, 0);
  const repairSum = rows.reduce(
    (acc, r) => acc + (r.avg_repair_hours ?? 0) * r.outages_resolved,
    0,
  );
  const slaMet = rows.reduce(
    (acc, r) => acc + ((r.sla_met_pct ?? 0) / 100) * r.outages_resolved,
    0,
  );

  const availability =
    observed && s.machines
      ? 100 * (1 - downtime / (s.machines * observed))
      : null;
  const avgDown = observed ? downtime / observed : null;
  const avgRepair = resolved ? repairSum / resolved : null;
  const slaPct = resolved ? (100 * slaMet) / resolved : null;

  const pct = (v: number | null) =>
    v == null
      ? "–"
      : `${v.toLocaleString("cs", { maximumFractionDigits: 1 })} %`;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatTile
          label="Teď mimo provoz"
          value={`${s.current.length} / ${s.machines}`}
          hint="strojů"
          tone={s.current.length ? "bad" : "good"}
        />
        <StatTile
          label="Teď po SLA"
          value={breached}
          hint={`limit ${formatDuration(s.default_sla_hours)} (výchozí)`}
          tone={breached ? "bad" : "good"}
        />
        <StatTile
          label="Dostupnost strojů"
          value={pct(availability)}
          hint="za zvolené období"
        />
        <StatTile
          label="Průměrně nefunkčních"
          value={
            avgDown == null
              ? "–"
              : avgDown.toLocaleString("cs", { maximumFractionDigits: 2 })
          }
          hint="strojů v každém okamžiku"
        />
        <StatTile
          label="Průměrná doba opravy"
          value={avgRepair == null ? "–" : formatDuration(avgRepair)}
          hint={`${resolved} opravených výpadků`}
        />
        <StatTile
          label="Opraveno v rámci SLA"
          value={pct(slaPct)}
          hint="z opravených výpadků"
          tone={slaPct == null ? "neutral" : slaPct >= 90 ? "good" : "bad"}
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Stroj je mimo provoz, když má ve Fabmanu stav „locked“. Data se sbírají
        od {new Date(s.tracking_since).toLocaleDateString("cs")} a přesnost
        odpovídá tomu, jak často běží dataloader.
      </p>
    </>
  );
}
