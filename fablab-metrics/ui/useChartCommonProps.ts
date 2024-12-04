import { formatDate } from "date-fns";
import { useDateRange } from "fablab-metrics/ui/useDateRange";

export function useChartCommonProps({ leftAxisLegend }: any) {
  const { zoom } = useDateRange();

  return {
    margin: { top: 20, right: 170, bottom: 20, left: 80 },
    axisLeft: {
      tickSize: 5,
      tickPadding: 15,
      tickRotation: 0,
      legend: leftAxisLegend,
      legendPosition: "middle",
      legendOffset: -60,
      truncateTickAt: 0,
    },
    axisBottom: {
      format: (value: any) =>
        formatDate(value, zoom === "1m" ? "LLLL, yyyy" : "yyyy"),
      tickValues: zoom === "1m" ? "every month" : "every year",
    },
    legends: [
      {
        anchor: "top-right",
        direction: "column",
        justify: false,
        translateX: 210,
        translateY: 0,
        itemsSpacing: 2,
        itemWidth: 170,
        itemHeight: 20,
        itemDirection: "left-to-right",
        itemOpacity: 0.85,
        symbolSize: 20,
        effects: [
          {
            on: "hover",
            style: {
              itemOpacity: 1,
            },
          },
        ],
      },
    ],
    colors: {
      scheme: "tableau10",
    },
  };
}
