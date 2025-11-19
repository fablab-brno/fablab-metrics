"use client";

import { BarTooltip, ResponsiveBar } from "@nivo/bar";
import { useTheme } from "@nivo/core";
import { Chip } from "@nivo/tooltip";
import { formatDate } from "date-fns";
import { useMetrics } from "fablab-metrics/components/useMetrics";
import { useChartCommonProps } from "fablab-metrics/ui/useChartCommonProps";
import { useDateRange } from "fablab-metrics/ui/useDateRange";
import { sum } from "ramda";
import { useMemberPackageFilter } from "fablab-metrics/ui/useMemberPackageFilter";


export function ActiveMembersByPackage() {
  const { zoom } = useDateRange();
  const metrics = useMetrics("active_members_by_package");
  const { selectedPackages = [] } = useMemberPackageFilter();

  const chartCommonProps = useChartCommonProps({
    leftAxisLegend: "Počet členů",
  });

  const sumOthers = (metric: any)=> {
    return sum(
      Object.keys(metric)
        .filter((key) => key !== "date" && !selectedPackages.find(p => p.name.includes(key)))
        .map((key) => metric[key]),
    );
  }

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
            .filter(
              (key) =>
                key !== "date" && key !== "Ostatní" && !selectedPackages.find(p => p.name.includes(key)),
            )
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

  if (metrics.isLoading) return null;

  const data = metrics.data.map((m: any) => ({
      ...Object.fromEntries(Object.entries(m).filter(([key]) => !key.startsWith("Tovaryš"))),
      Ostatní: sumOthers(m),
      "Tovaryš": Object.values(Object.fromEntries(Object.entries(m).filter(([key]) => key.startsWith("Tovaryš")))).reduce((sum: number, value) => sum + (value as number), 0) ?? 0
  }));

  return (
    <div className="w-full h-96">
      {/* @ts-expect-error */}
      <ResponsiveBar
        {...chartCommonProps}
        data={data}
        keys={["Ostatní", ...selectedPackages.map((p) => p.name)]}
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

