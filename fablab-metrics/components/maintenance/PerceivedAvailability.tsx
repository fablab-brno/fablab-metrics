"use client";

import { ResponsiveBar } from "@nivo/bar";
import classnames from "classnames";
import { StatTile } from "fablab-metrics/components/maintenance/StatTile";
import { useMetrics } from "fablab-metrics/components/useMetrics";
import { useChartCommonProps } from "fablab-metrics/ui/useChartCommonProps";
import useSWR from "swr";

type State = "ok" | "limited" | "unavailable";

type CategoryStatus = {
  category: string;
  state: State;
  machines: number;
  working: number;
  threshold: number;
};

type PerceivedStatus = {
  date: string;
  demand_percentile: number;
  demand_window_days: number;
  categories: CategoryStatus[];
};

const STATE_LABELS: Record<State, string> = {
  ok: "V pořádku",
  limited: "Omezeno",
  unavailable: "Nedostupné",
};

const STATE_COLORS: Record<State, string> = {
  ok: "#59a14f",
  limited: "#f28e2b",
  unavailable: "#e15759",
};

function usePerceivedStatus() {
  return useSWR<PerceivedStatus | null>(
    "/api/metrics/perceived_status",
    (url: string) => fetch(url).then((res) => res.json()),
  );
}

const pct = (v: number | null) =>
  v == null ? "–" : `${v.toLocaleString("cs", { maximumFractionDigits: 1 })} %`;

/** Share of visits in each state over the selected range. */
export function PerceivedSummary() {
  const metrics = useMetrics("perceived_availability");

  if (metrics.isLoading) return null;

  const rows: any[] = metrics.data ?? [];
  const visits = rows.reduce((acc, r) => acc + r.visits, 0);

  if (!visits) {
    return (
      <p className="text-sm text-gray-600">
        Pro zvolené období nejsou k dispozici žádné návštěvy.
      </p>
    );
  }

  const share = (state: State) =>
    (100 * rows.reduce((acc, r) => acc + r[state], 0)) / visits;
  const affected = share("limited") + share("unavailable");

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Příchodů s omezením"
          value={pct(affected)}
          hint="omezeno nebo nedostupné"
          tone={affected ? "bad" : "good"}
        />
        <StatTile
          label={STATE_LABELS.limited}
          value={pct(share("limited"))}
          hint="funkčních méně než obvykle běží"
        />
        <StatTile
          label={STATE_LABELS.unavailable}
          value={pct(share("unavailable"))}
          hint="v kategorii nejde žádný stroj"
        />
        <StatTile
          label="Příchodů"
          value={visits.toLocaleString("cs")}
          hint="členů se školením na stroje"
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Pro každý příchod do dílny (první průchod vstupem za den) se vezmou
        kategorie strojů, které člen smí používat (má některé ze školení, která
        stroj ve Fabmanu odemykají). Příchod dostane nejhorší stav z těchto
        kategorií. Kategorie je omezená, když funguje méně strojů, než kolik
        jich obvykle běží současně (90. percentil při příchodech za posledních
        180 dní).
      </p>
    </>
  );
}

export function PerceivedByState() {
  const metrics = useMetrics("perceived_availability");
  const chartCommonProps = useChartCommonProps({
    leftAxisLegend: "Příchodů (%)",
  });

  if (metrics.isLoading) return null;

  const states: State[] = ["ok", "limited", "unavailable"];
  const data = (metrics.data ?? []).map((row: any) => ({
    date: row.date,
    ...Object.fromEntries(
      states.map((s) => [STATE_LABELS[s], row[`${s}_pct`] ?? 0]),
    ),
  }));

  return (
    <div className="w-full h-80">
      {/* @ts-expect-error */}
      <ResponsiveBar
        {...chartCommonProps}
        data={data}
        indexBy="date"
        keys={states.map((s) => STATE_LABELS[s])}
        colors={states.map((s) => STATE_COLORS[s])}
        maxValue={100}
        label={({ value }) =>
          value && value >= 5
            ? `${value.toLocaleString("cs", { maximumFractionDigits: 0 })} %`
            : ""
        }
      />
    </div>
  );
}

export function PerceivedByCategory() {
  const metrics = useMetrics("perceived_availability_by_category");
  const chartCommonProps = useChartCommonProps({
    leftAxisLegend: "Příchodů s omezením (%)",
  });

  if (metrics.isLoading) return null;

  const data = metrics.data ?? [];
  const keys = Array.from(
    new Set(
      data.flatMap((row: any) => Object.keys(row).filter((k) => k !== "date")),
    ),
  ).sort() as string[];

  return (
    <div className="w-full h-96">
      {/* @ts-expect-error */}
      <ResponsiveBar
        {...chartCommonProps}
        data={data}
        indexBy="date"
        keys={keys}
        groupMode="grouped"
        maxValue={100}
      />
    </div>
  );
}

export function CategoryStatusTable() {
  const status = usePerceivedStatus();

  if (status.isLoading) return null;

  if (!status.data) {
    return (
      <p className="text-sm text-gray-600">
        Zatím nejsou k dispozici data. Objeví se po příštím běhu dataloaderu.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-gray-500 border-b">
          <tr>
            <th className="py-2 pr-4">Kategorie</th>
            <th className="py-2 pr-4 text-right">Funkčních</th>
            <th className="py-2 pr-4 text-right">Obvykle běží</th>
            <th className="py-2">Stav</th>
          </tr>
        </thead>
        <tbody>
          {status.data.categories.map((c) => (
            <tr key={c.category} className="border-b border-gray-100">
              <td className="py-2 pr-4">{c.category}</td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {c.working} / {c.machines}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {c.threshold}
              </td>
              <td className="py-2">
                <span
                  className={classnames("font-semibold", {
                    "text-green-700": c.state === "ok",
                    "text-orange-600": c.state === "limited",
                    "text-red-600": c.state === "unavailable",
                  })}
                >
                  {STATE_LABELS[c.state]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
