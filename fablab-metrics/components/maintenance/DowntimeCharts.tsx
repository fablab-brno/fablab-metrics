"use client";

import { ResponsiveBar } from "@nivo/bar";
import { useMetrics } from "fablab-metrics/components/useMetrics";
import { useChartCommonProps } from "fablab-metrics/ui/useChartCommonProps";
import { useResources } from "fablab-metrics/ui/useResources";
import { unique } from "fablab-metrics/utils/array";

function SingleSeriesBar({
  field,
  label,
  legend,
  maxValue,
}: {
  field: string;
  label: string;
  legend: string;
  maxValue?: number;
}) {
  const metrics = useMetrics("machine_downtime");
  const chartCommonProps = useChartCommonProps({ leftAxisLegend: legend });

  if (metrics.isLoading) return null;

  const data = (metrics.data ?? []).map((row: any) => ({
    date: row.date,
    [label]: row[field] ?? 0,
  }));

  return (
    <div className="w-full h-80">
      {/* @ts-expect-error */}
      <ResponsiveBar
        {...chartCommonProps}
        // One series: the section heading names it, no legend needed.
        legends={[]}
        margin={{ top: 20, right: 20, bottom: 20, left: 80 }}
        data={data}
        keys={[label]}
        indexBy="date"
        maxValue={maxValue ?? "auto"}
        // Neutral series color; red is reserved for the "bad" status in tiles.
        colors={["#4e79a7"]}
        borderRadius={2}
        label={({ value }) =>
          value ? value.toLocaleString("cs", { maximumFractionDigits: 2 }) : ""
        }
      />
    </div>
  );
}

export function MachineAvailability() {
  return (
    <SingleSeriesBar
      field="availability_pct"
      label="Dostupnost"
      legend="Dostupnost (%)"
      maxValue={100}
    />
  );
}

export function AverageMachinesDown() {
  return (
    <SingleSeriesBar
      field="avg_machines_down"
      label="Průměrně nefunkčních strojů"
      legend="Počet strojů"
    />
  );
}

export function AverageRepairTime() {
  return (
    <SingleSeriesBar
      field="avg_repair_hours"
      label="Průměrná doba opravy"
      legend="Hodiny"
    />
  );
}

export function SlaCompliance() {
  return (
    <SingleSeriesBar
      field="sla_met_pct"
      label="Opraveno v rámci SLA"
      legend="Výpadků v SLA (%)"
      maxValue={100}
    />
  );
}

export function DowntimeByCategory() {
  const metrics = useMetrics("machine_downtime_by_category");
  const resources = useResources();
  const chartCommonProps = useChartCommonProps({
    leftAxisLegend: "Hodiny mimo provoz",
  });

  if (metrics.isLoading || resources.isLoading) return null;

  const data = metrics.data ?? [];
  // Keys come from all machine categories (not only those present in the
  // selected range), so each category keeps its color when the range changes.
  const keys = unique([
    ...(resources.data ?? []).map((r: any) => r.category || "Bez kategorie"),
    ...data.flatMap((row: any) => Object.keys(row).filter((k) => k !== "date")),
  ]).sort() as string[];

  return (
    <div className="w-full h-96">
      {/* @ts-expect-error */}
      <ResponsiveBar
        {...chartCommonProps}
        data={data}
        indexBy="date"
        keys={keys}
        groupMode="grouped"
      />
    </div>
  );
}
