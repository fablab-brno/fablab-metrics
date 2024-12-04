"use client";

import { ResponsiveLine } from "@nivo/line";
import { useMetrics } from "fablab-metrics/components/useMetrics";
import { useChartCommonProps } from "fablab-metrics/ui/useChartCommonProps";
import { useDateRange } from "fablab-metrics/ui/useDateRange";

export function TrainingsByMember() {
  const metrics = useMetrics("trainings_by_member");
  const { zoom } = useDateRange();

  const chartCommonProps = useChartCommonProps({
    leftAxisLegend: "Počet",
  });

  if (metrics.isLoading) return null;

  const dataset = [
    {
      id: ">1",
      data: metrics.data.map((m: any) => ({
        x: m.date,
        y: m.one,
      })),
    },
    {
      id: "Základní",
      data: metrics.data.map((m: any) => ({
        x: m.date,
        y: m.basic,
      })),
    },
    {
      id: "Pokročilé",
      data: metrics.data.map((m: any) => ({
        x: m.date,
        y: m.advanced,
      })),
    },
  ];

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
