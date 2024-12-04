"use client";

import { ResponsiveBar } from "@nivo/bar";
import { useMetrics } from "fablab-metrics/components/useMetrics";
import { useChartCommonProps } from "fablab-metrics/ui/useChartCommonProps";
import { useResources } from "fablab-metrics/ui/useResources";
import { unique } from "fablab-metrics/utils/array";

export function ResourceUsage() {
  const metrics = useMetrics("resources_usage");
  const resources = useResources();

  const chartCommonProps = useChartCommonProps({
    leftAxisLegend: "Počet hodin",
  });

  if (metrics.isLoading || resources.isLoading) return null;

  const printers = "3D Tiskárny";
  const printersAlt = "3D Tiskárny /10";

  const dataset = metrics.data.map((row: any) => ({
    ...row,
    [printersAlt]: row[printers] / 10,
  }));

  const keys = unique(
    resources.data.map((tc: any) =>
      tc.category === printers ? printersAlt : tc.category,
    ),
  ).sort();

  return (
    <div className="w-full h-96">
      {/* @ts-expect-error */}
      <ResponsiveBar
        {...chartCommonProps}
        data={dataset}
        indexBy="date"
        keys={keys}
        groupMode="grouped"
      />
    </div>
  );
}
