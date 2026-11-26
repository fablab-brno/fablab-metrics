"use client";

import {
  Outage,
  formatDuration,
  useMachineStatus,
} from "fablab-metrics/components/maintenance/useMachineStatus";

export function OutagesTable({ kind }: { kind: "current" | "recent" }) {
  const status = useMachineStatus();

  if (status.isLoading || !status.data) return null;

  const outages: Outage[] = status.data[kind];

  if (outages.length === 0) {
    return (
      <p className="text-sm text-gray-600">
        {kind === "current"
          ? "Všechny stroje jsou v provozu."
          : "Zatím žádné ukončené výpadky."}
      </p>
    );
  }

  const date = (v: string | null) =>
    v ? new Date(v).toLocaleDateString("cs") : "–";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-gray-500 border-b">
          <tr>
            <th className="py-2 pr-4">Stroj</th>
            <th className="py-2 pr-4">Kategorie</th>
            <th className="py-2 pr-4">Od</th>
            {kind === "recent" && <th className="py-2 pr-4">Do</th>}
            <th className="py-2 pr-4 text-right">Doba</th>
            <th className="py-2 pr-4">SLA</th>
            <th className="py-2">Poznámka</th>
          </tr>
        </thead>
        <tbody>
          {outages.map((o) => (
            <tr
              key={`${o.resource_id}-${o.date_start}`}
              className="border-b border-gray-100 align-top"
            >
              <td className="py-2 pr-4 font-semibold">{o.name}</td>
              <td className="py-2 pr-4">{o.category}</td>
              <td className="py-2 pr-4 tabular-nums">{date(o.date_start)}</td>
              {kind === "recent" && (
                <td className="py-2 pr-4 tabular-nums">{date(o.date_end)}</td>
              )}
              <td className="py-2 pr-4 text-right tabular-nums">
                {formatDuration(o.hours)}
              </td>
              <td className="py-2 pr-4 whitespace-nowrap">
                {o.sla_breached ? (
                  <span className="text-red-600 font-semibold">
                    ✕ překročeno
                  </span>
                ) : (
                  <span className="text-green-700">✓ v limitu</span>
                )}{" "}
                <span className="text-gray-400 text-xs">
                  ({formatDuration(o.sla_hours)})
                </span>
              </td>
              <td className="py-2 text-gray-600">{o.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
