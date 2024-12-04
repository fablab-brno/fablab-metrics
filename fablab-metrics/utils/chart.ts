import {
  addMonths,
  addYears,
  endOfMonth,
  endOfYear,
  formatDate,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { DateRangeType, ZoomType } from "fablab-metrics/ui/useDateRange";
import { YMD } from "fablab-metrics/utils/date";

export function getMarkers({
  range,
  zoom,
}: {
  range: DateRangeType;
  zoom: ZoomType;
}) {
  const rangeStart = zoom === "1y" ? startOfYear : startOfMonth;
  const rangeEnd = zoom === "1y" ? endOfYear : endOfMonth;
  const nextDate = zoom === "1y" ? addYears : addMonths;

  const markers = [];

  let date = rangeStart(range.start);
  const dateUntil = rangeEnd(range.end);

  while (date < dateUntil) {
    let dateFormat =
      zoom === "1y" ? "yyyy" : date.getMonth() === 0 ? "LLLL, yyyy" : "LLLL";

    markers.push({
      axis: "x",
      value: formatDate(date, YMD),
      lineStyle: { stroke: "rgba(0, 0, 0, .35)", strokeWidth: 2 },
      legend: formatDate(date, dateFormat),
      legendOrientation: "horizontal",
    });

    date = nextDate(date, 1);
  }

  return markers;
}
