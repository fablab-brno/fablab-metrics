"use client";

import { ResponsiveBar } from "@nivo/bar";
import { useMetrics } from "fablab-metrics/components/useMetrics";
import { useChartCommonProps } from "fablab-metrics/ui/useChartCommonProps";

export function MemberVisits() {
  const metrics = useMetrics("member_visits");

  const chartCommonProps = useChartCommonProps({
    leftAxisLegend: "Počet dnů",
  });

  if (metrics.isLoading) return null;

  return (
    <div className="w-full h-96">
      {/* @ts-expect-error */}
      <ResponsiveBar
        {...chartCommonProps}
        data={metrics.data}
        indexBy="date"
        keys={["<3", "3-7", ">7"]}
        enableTotals
      />
    </div>
  );
}
