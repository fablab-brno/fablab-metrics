"use client";

import { BarTooltip, ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { useMetrics } from "fablab-metrics/components/useMetrics";
import { useChartCommonProps } from "fablab-metrics/ui/useChartCommonProps";
import { useDateRange } from "fablab-metrics/ui/useDateRange";
import { formatDate } from "date-fns";
import { useTheme } from "@nivo/core";
import { Chip } from "@nivo/tooltip";

const TOURS = [
  "FabLab Tour (FabLab Brno, Taras Krasavin)"
];

export function TotalToursReservations() {
  const metrics = useMetrics("total_tours_reservations");
  const { zoom } = useDateRange();

  const chartCommonProps = useChartCommonProps({
    leftAxisLegend: "Počet",
  });

  if (metrics.isLoading) return null;

  return (
    <div className="w-full h-96">

      {/* @ts-expect-error */}
      <ResponsiveBar
        {...chartCommonProps}
        data={metrics.data}
        keys={TOURS}
        indexBy="date"
        axisBottom={{
          format: (value) =>
            formatDate(value, zoom === "1m" ? "LLLL, yyyy" : "yyyy"),
          tickValues: zoom === "1m" ? "every month" : "every year",
        }}
        enableTotals
        tooltip={PackageTooltip}
      />
    </div>
  );
}

function PackageTooltip({ id, label, value, ...props }: any) {
  const theme = useTheme();

  return <BarTooltip id={id} label={label} value={value} {...props} />
}
