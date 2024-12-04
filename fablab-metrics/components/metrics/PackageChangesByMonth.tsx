"use client";

import { ResponsiveBar } from "@nivo/bar";
import { useMetrics } from "fablab-metrics/components/useMetrics";
import { useChartCommonProps } from "fablab-metrics/ui/useChartCommonProps";

export function PackageChangesByMonth() {
  const metrics = useMetrics("package_changes_by_month");

  const chartCommonProps = useChartCommonProps({
    leftAxisLegend: "Počet hodin",
  });

  if (metrics.isLoading) return null;

  return (
    <div className="w-full h-96">
      {/* @ts-expect-error */}
      <ResponsiveBar
        {...chartCommonProps}
        data={metrics.data}
        keys={[
          "Učedník+",
          "Učedník-",
          "Tovaryš+",
          "Tovaryš-",
          "Mistr+",
          "Mistr-",
        ]}
        colors={[
          "#E2F7C2",
          "#FACDCD",
          "#94C843",
          "#D64545",
          "#507712",
          "#911111",
        ]}
        indexBy="date"
        groupMode="grouped"
        valueFormat={(value: number) => `${Math.abs(value)}`}
        labelTextColor="inherit:darker(1.2)"
      />
    </div>
  );
}
