import {
  addMonths,
  addYears,
  eachMonthOfInterval,
  eachYearOfInterval,
  format,
} from "date-fns";
import { DATA_PATH } from "fablab-metrics/env";
import { flatten } from "fablab-metrics/utils/array";
import { type NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params: { metric } }: { params: { metric: string } },
) {
  const searchParams = request.nextUrl.searchParams;

  const granularity = searchParams.get("granularity") ?? "1m";
  let dateStart: string | Date | null = searchParams.get("date_start");
  let dateEnd: string | Date | null = searchParams.get("date_end");

  if (dateStart == null) {
    return;
  }

  let dateRange: Date[] = [];
  let datasetDataFormat = "";

  if (granularity === "1m") {
    if (dateEnd == null) {
      dateEnd = addMonths(dateStart, 1);
    }

    dateRange = eachMonthOfInterval({ start: dateStart, end: dateEnd });

    datasetDataFormat = "yyyy-MM";
  } else if (granularity === "1y") {
    if (dateEnd == null) {
      dateEnd = addYears(dateStart, 1);
    }

    dateRange = eachYearOfInterval({ start: dateStart, end: dateEnd });

    datasetDataFormat = "yyyy";
  }

  const data = await Promise.all(
    dateRange.map((date) => {
      const filename = path.join(
        DATA_PATH,
        metric,
        granularity,
        `${format(date, datasetDataFormat)}.json`,
      );

      return fs
        .readFile(filename, "utf8")
        .then((content) => JSON.parse(content))
        .catch(() => []);
    }),
  );

  return Response.json(flatten(data));
}
