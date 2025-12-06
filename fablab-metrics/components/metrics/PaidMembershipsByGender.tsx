"use client";

import { ResponsiveBar } from "@nivo/bar";
import { useTheme } from "@nivo/core";
import { Chip } from "@nivo/tooltip";
import { formatDate } from "date-fns";
import { useMetrics } from "fablab-metrics/components/useMetrics";
import { useChartCommonProps } from "fablab-metrics/ui/useChartCommonProps";
import { useDateRange } from "fablab-metrics/ui/useDateRange";
import { useMemberPackageFilter } from "fablab-metrics/ui/useMemberPackageFilter";


const GENDERS = {
  "male_count": "Muž",
  "female_count": "Žena",
  "other_count": "Jiné",
  "none_count": "Neuvedeno",
}

const getTooltipBoxColor = (column: string) => {
  switch(column){
    case GENDERS.male_count:
      return "#507712";
    case GENDERS.female_count:
      return "#D64545";
    case GENDERS.other_count:
      return "#FFFF00";
    default:
      return "#808080";
  }
}

export function PaidMembershipsByGender() {
  const { zoom } = useDateRange();
  const metrics = useMetrics("active_members_by_package");
  const { selectedPackages = [] } = useMemberPackageFilter();

  const chartCommonProps = useChartCommonProps({
    leftAxisLegend: "Počet členů",
  });

  const PackageTooltip = ({ data }: any) => {
    const theme = useTheme();
    console.debug(data)
    return (
      <div style={theme.tooltip.container}>
        <div style={theme.tooltip.basic}>
        <span>
          Celkem: <strong>{`${Object.values(data).reduce((acc: any, curr: any) => acc + curr, 0)}`}</strong>
        </span>
        </div>

        <div className="mt-4 flex flex-col">
          {Object.keys(data)
            .filter(
              (key) => key !== "date")
            .sort()
            .map((key) => (
              <div style={theme.tooltip.basic} key={key}>
                <Chip color={getTooltipBoxColor(key)} style={theme.tooltip.chip} />
                <span key={key}>
                {key}: <strong>{data[key]}</strong>
              </span>
              </div>
            ))}
        </div>
      </div>
    )
  }

  if (metrics.isLoading) return null;

  const filterJourneyman = (data: any, shouldBeEqual: boolean) => {
    return Object.entries(data).filter(p => {
      const isJourneyman = p[0].startsWith("Tovaryš")

      return shouldBeEqual ? isJourneyman : !isJourneyman
    })
  }

  const mergeValueDictionaries = (data: any[]) => {
    return data.reduce((acc, curr) => {
      return Object.fromEntries(
        Object.entries(curr).map(([key, value]) => [
          key,
          (acc[key] || 0) + value
        ])
      );
    }, {})
  }

  const summarizeValueThroughDictionaries = (data: {}, key: string) => {
    return Object.values(data).reduce((sum: any, item: any) => sum + item[key], 0)
  }

  const filterPackagesByActiveFilters = (data: {}) => {
    return Object.entries(data).filter(p => selectedPackages.find((sp: any) => sp.name.includes(sp[0]) || sp.name == p[0]))
  }

  const data = metrics.data
    .map(
      (m: any) => {
        const { date, ...rest } = m;

        // merge all Tovaryš packages to common Tovaryš
        var packagesData = {
          ...Object.fromEntries(filterJourneyman(rest, false)),
          "Tovaryš": mergeValueDictionaries(Object.values(Object.fromEntries(filterJourneyman(rest, true))))
        }

        // apply package filter
        const filteredPackagesData = {
          ...Object.fromEntries(filterPackagesByActiveFilters(packagesData))
        }

        // summarize count and prepare data for chart
        return {
          date: date,
          ...Object.fromEntries(Object.keys(GENDERS).map(k => [GENDERS[k as keyof typeof GENDERS], summarizeValueThroughDictionaries(filteredPackagesData, k)]))
        }
      }
    )

  return (
    <div className="w-full h-96">
      {/* @ts-expect-error */}
      <ResponsiveBar
        {...chartCommonProps}
        data={data}
        keys={Object.values(GENDERS)}
        indexBy="date"
        axisBottom={{
          format: (value) =>
            formatDate(value, zoom === "1m" ? "LLLL, yyyy" : "yyyy"),
          tickValues: zoom === "1m" ? "every month" : "every year",
        }}
        colors={(key) => getTooltipBoxColor(String(key.id))}
        enableTotals
        tooltip={PackageTooltip}
      />
    </div>
  );
}

