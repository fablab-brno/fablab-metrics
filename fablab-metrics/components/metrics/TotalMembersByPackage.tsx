"use client";

import { ResponsiveLine } from "@nivo/line";
import { useMetrics } from "fablab-metrics/components/useMetrics";
import { useChartCommonProps } from "fablab-metrics/ui/useChartCommonProps";
import { useDateRange } from "fablab-metrics/ui/useDateRange";
import { sum } from "ramda";
import { useMemberPackageFilter } from "fablab-metrics/ui/useMemberPackageFilter";


export function TotalMembersByPackage() {
  const { zoom } = useDateRange();
  const metrics = useMetrics("total_members_by_package");
  const { selectedPackages = [] } = useMemberPackageFilter();

  const chartCommonProps = useChartCommonProps({
    leftAxisLegend: "Počet členů",
  });

  const sumOthers = (metric: any)=> {
    return sum(
      Object.keys(metric)
        .filter((key) => key !== "date" && !selectedPackages.find(p => p && p.name.includes(key)))
          .map((key) => metric[key]),
        );
  }

  if (metrics.isLoading) return null;

  let dataset: any[] = [];

  dataset.push({
    id: "Ostatní",
    data: metrics.data.map((metric: any) => ({
      x: metric.date,
      y: sumOthers(metric),
    })),
  });

  selectedPackages.forEach((p) => {
    if (p && p.name.startsWith("Tovaryš")) {
      dataset.push({
        id: p?.name,
        data: metrics.data.map((metric: any) => ({
          x: metric.date,
          y: Object.values(Object.fromEntries(Object.entries(metric).filter(([key]) => key.startsWith("Tovaryš")))).reduce((sum: number, value) => sum + (value as number), 0) ?? 0
        })),
      });
    }
    else {
      dataset.push({
        id: p?.name ?? "",
        data: metrics.data.map((metric: any) => ({
          x: metric.date,
          y: metric[p?.name ?? ""] ?? 0,
        })),
      });
    }
  });

  dataset.push({
    id: "Celkem vybrané",
    data: metrics.data.map((metric: any) => ({
      x: metric.date,
      y: sum(selectedPackages.map((p) => metric[p?.name ?? ""] ?? 0)),
    })),
  });

  dataset.push({
    id: "Celkem všechny",
    data: metrics.data.map((metric: any) => ({
      x: metric.date,
      y: sumOthers(metric) + sum(selectedPackages.map((p) => metric[p?.name ?? ""] ?? 0)),
    })),
  });

  return (
    <div className="w-full h-96">
      {/* @ts-expect-error */}
      <ResponsiveLine
        {...chartCommonProps}
        data={dataset}
        enablePoints
        enablePointLabel
        enableSlices="x"
        xScale={{
          type: "time",
          format: "%Y-%m-%d",
          useUTC: false,
          precision: zoom === "1m" ? "month" : "year",
        }}
      />
    </div>
  );
}
