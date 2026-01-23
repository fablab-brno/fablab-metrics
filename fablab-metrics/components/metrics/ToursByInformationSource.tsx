"use client";

import { BarTooltip, ResponsiveBar } from "@nivo/bar";
import { useTheme } from "@nivo/core";
import { Chip } from "@nivo/tooltip";
import { formatDate } from "date-fns";
import { useMetrics } from "fablab-metrics/components/useMetrics";
import { useToursSource } from "fablab-metrics/components/useToursSource";
import { useChartCommonProps } from "fablab-metrics/ui/useChartCommonProps";
import { useDateRange } from "fablab-metrics/ui/useDateRange";


export function ToursByInformationSource() {
  const { zoom } = useDateRange();
  const metrics = useMetrics("tours_info_source");
  const keys = useToursSource();

  const chartCommonProps = useChartCommonProps({
    leftAxisLegend: "Zdroj",
  });

  const PackageTooltip = ({ id, label, value, ...props }: any) => {
    const theme = useTheme();

    if (id !== "Ostatní") {
      return <BarTooltip id={id} label={label} value={value} {...props} />;
    }

    return (
      <div style={theme.tooltip.container}>
        <div style={theme.tooltip.basic}>
          <Chip color={props.color!} style={theme.tooltip.chip} />
          <span>
          {label}: <strong>{`${value}`}</strong>
        </span>
        </div>

        <div className="mt-4 flex flex-col">
          {Object.keys(props.data)
            .filter((key) => key !== "date")
            .sort()
            .map((key) => (
              <span key={key}>
              {key}: <strong>{props.data[key]}</strong>
            </span>
            ))}
        </div>
      </div>
    );
  }

  if (metrics.isLoading || keys.isLoading) return null;

  return (
    <div className="w-full h-96">
      {/* @ts-expect-error */}
      <ResponsiveBar
        {...chartCommonProps}
        data={metrics.data}
        keys={keys.data}
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

