"use client";

import { ResponsiveBar } from "@nivo/bar";
import { useMetrics } from "fablab-metrics/components/useMetrics";
import { useTrainingCourses } from "fablab-metrics/components/useTrainingCourses";
import { useChartCommonProps } from "fablab-metrics/ui/useChartCommonProps";
import { unique } from "fablab-metrics/utils/array";

export function TrainingsByDate() {
  const metrics = useMetrics("trainings_by_date");
  const trainingCourses = useTrainingCourses();

  const chartCommonProps = useChartCommonProps({
    leftAxisLegend: "Počet",
  });

  if (metrics.isLoading || trainingCourses.isLoading) return null;

  const keys = unique(
    trainingCourses.data.map((tc: any) => tc.category),
  ).sort();

  return (
    <div className="w-full h-96">
      <ResponsiveBar
        {...chartCommonProps}
        data={metrics.data}
        indexBy="date"
        keys={keys}
        groupMode="grouped"
        // Totals
        enableTotals
        totalsOffset={10}
        // Labels
        // @ts-expect-error
        labelPosition="start"
        labelOffset={-10}
      />
    </div>
  );
}
