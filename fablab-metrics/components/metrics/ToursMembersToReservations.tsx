"use client";

import { useMetrics } from "fablab-metrics/components/useMetrics";
import { useChartCommonProps } from "fablab-metrics/ui/useChartCommonProps";
import { useDateRange } from "fablab-metrics/ui/useDateRange";
import { ResponsiveBar } from "@nivo/bar";
import { formatDate } from "date-fns";
import { useTheme } from "@nivo/core";
import { Chip } from "@nivo/tooltip";

const DATA = {
  "members": "Registrace Fabman",
  "non_members": "Neregistrovaní"
};

export function ToursMembersToReservations() {
  const metrics = useMetrics("tours_members_to_reservations");
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
        keys={Object.keys(DATA)}
        indexBy="date"
        axisBottom={{
          format: (value) =>
            formatDate(value, zoom === "1m" ? "LLLL, yyyy" : "yyyy"),
          tickValues: zoom === "1m" ? "every month" : "every year",
        }}
        enableTotals
        tooltip={PackageTooltip}
        colors={[
          "#507712",
          "#D64545"
        ]}
        legends={[]}
      />
    </div>
  );
}

function PackageTooltip({ data }: any) {
  const theme = useTheme();

  return (
    <div style={theme.tooltip.container}>
      <div style={theme.tooltip.basic}>
        <span>
          Celkem: <strong>{`${data.total}`} (⌀{data.average_total})</strong>
          <br/>
          Registrace Fabman: <strong>{`${Math.round((data.members / data.total) * 100)}`}%</strong>
        </span>
      </div>

      <div className="mt-4 flex flex-col">
        {Object.keys(data)
          .filter(
            (key) =>
              key !== "date" && Object.keys(DATA).includes(key),
          )
          .sort()
          .map((key) => (
            <div style={theme.tooltip.basic} key={key}>
              <Chip color={(key == "members") ? "#507712" : "#D64545"} style={theme.tooltip.chip} />
              <span key={key}>
                {DATA[key as keyof typeof DATA]}: <strong>{data[key]} (⌀{data["average_" + key]})</strong>
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
