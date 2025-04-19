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
  "non_members": "Neregistrovaní",
  "purchased_memberships": "Zakoupená členství do 3 měsíců",
  "purchased_memberships_progress": "Neuzavřená zakoupená členství",
};

export function ToursMembersToReservations() {
  const metrics = useMetrics("tours_members_to_reservations");
  const { zoom } = useDateRange();

  const chartCommonProps = useChartCommonProps({
    leftAxisLegend: "Počet",
  });

  if (metrics.isLoading) return null;

  const data = metrics.data.map((d: any) => ({
    total: d.total,
    average_total: d.average_total,
    date: d.date,
    [DATA.members]: d.members,
    [DATA.non_members]: d.non_members,
    [DATA.purchased_memberships]: d.purchased_memberships
  }));

  return (
    <div className="w-full h-96">

      {/* @ts-expect-error */}
      <ResponsiveBar
        {...chartCommonProps}
        groupMode="grouped"
        data={data}
        keys={Object.values(DATA)}
        indexBy="date"
        axisBottom={{
          format: (value) =>
            formatDate(value, zoom === "1m" ? "LLLL, yyyy" : "yyyy"),
          tickValues: zoom === "1m" ? "every month" : "every year",
        }}
        tooltip={PackageTooltip}
        colors={(datum) => {
            var isActive = isColumnActiveForMembership(new Date(String(datum.data.date)));
            return getTooltipBoxColor(datum.id != DATA.purchased_memberships || isActive ? String(datum.id) : "");
        }}
        label={({ value }) => (value !== 0 ? String(value) : "")}
      />
    </div>
  );
}

const isColumnActiveForMembership = (date: Date) => {
    const today = new Date();
    return date <= new Date(today.setMonth(today.getMonth() - 3));
}

const getTooltipBoxColor = (column: string) => {
    switch(column){
        case DATA.members:
            return "#507712";
        case DATA.non_members:
            return "#D64545";
        case DATA.purchased_memberships:
            return "#FFFF00";
        default:
            return "#808080";
    }
}

function PackageTooltip({ data }: any) {
  const theme = useTheme();

  return (
    <div style={theme.tooltip.container}>
      <div style={theme.tooltip.basic}>
        <span>
          Celkem: <strong>{`${data.total}`} (⌀{data.average_total})</strong>
          <br/>
          Registrace Fabman: <strong>{`${Math.round((data[DATA.members] / data.total) * 100)}`}%</strong>
        </span>
      </div>

      <div className="mt-4 flex flex-col">
        {Object.keys(data)
          .filter(
            (key) =>
              key !== "date" && Object.values(DATA).includes(key),
          )
          .sort()
          .map((key) => (
            <div style={theme.tooltip.basic} key={key}>
              <Chip color={getTooltipBoxColor(isColumnActiveForMembership(new Date(data.date)) || key != DATA.purchased_memberships ? key : "")} style={theme.tooltip.chip} />
              <span key={key}>
                {key}: <strong>{data[key]}</strong>
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
