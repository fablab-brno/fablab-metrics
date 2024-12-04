import { formatDate } from "date-fns";
import { useDateRange } from "fablab-metrics/ui/useDateRange";
import { YMD } from "fablab-metrics/utils/date";
import useSWR from "swr";

export function useMetrics(metric: string) {
  const { range, zoom } = useDateRange();

  const params = new URLSearchParams();
  params.set("date_start", formatDate(range.start, YMD));
  params.set("date_end", formatDate(range.end, YMD));
  params.set("granularity", zoom);

  return useSWR(`/api/metrics/${metric}/?${params.toString()}`, (url) =>
    fetch(url).then((res) => res.json()),
  );
}
