import { Button } from "@headlessui/react";
import classnames from "classnames";
import {
  addYears,
  eachMonthOfInterval,
  eachYearOfInterval,
  endOfYear,
  format,
  isSameMonth,
  isSameYear,
  isWithinInterval,
  max,
  min,
  startOfYear,
  subYears,
} from "date-fns";
import { DateRangeType } from "fablab-metrics/ui/useDateRange";
import React from "react";

type ZoomLevel = "year" | "month";
export type DateRangeProps = {
  onLabelChange: (label: string) => void;
  onClose: () => void;

  value: Date;
  onChange: (value: Date) => void;

  range: DateRangeType;
  maxZoom: ZoomLevel;
};

const now = new Date();

export const DATE_MIN = new Date(2017, 1, 0);

export const DATE_MAX = endOfYear(now);

export function DateSelector({
  onClose,
  onChange,
  value,
  range,
  maxZoom = "month",
}: DateRangeProps) {
  const [zoom, setZoom] = React.useState<ZoomLevel>(maxZoom);

  React.useEffect(() => setZoom(maxZoom), [maxZoom]);

  const handleYearChange = (value: Date) => {
    if (maxZoom !== "year") {
      setZoom("month");
    }
    onChange(value);
  };

  return (
    <div className="bg-white p-4">
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-3">
          {zoom === "month" && (
            <YearNavigation
              className="col-start-2"
              value={value}
              onClick={() => setZoom("year")}
              onChange={onChange}
            />
          )}

          <Button
            onClick={onClose}
            className="col-start-3 justify-self-end rounded-full p-2 text-sm hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>

        {zoom === "year" && (
          <YearSelector
            value={value}
            onChange={handleYearChange}
            range={range}
          />
        )}
        {zoom === "month" && (
          <MonthSelector value={value} onChange={onChange} range={range} />
        )}
      </div>
    </div>
  );
}

type YearSelectorProps = {
  value: Date;
  onChange: (value: Date) => void;
  range: DateRangeType;
};

function YearSelector({ value, onChange, range }: YearSelectorProps) {
  const rangeEnd = min([DATE_MAX, addYears(value, 9)]);
  const rangeStart = max([DATE_MIN, subYears(rangeEnd, 9)]);
  return (
    <div className="grid grid-cols-3 gap-2 ">
      {eachYearOfInterval({ start: rangeStart, end: rangeEnd })
        .reverse()
        .map((date, i) => (
          <Button
            key={i}
            data-selected={isWithinInterval(date, range) ? true : undefined}
            className={classnames(
              "py-2 px-4 text-sm rounded border border-red-500 hover:bg-red-500 data-[selected]:hover:bg-red-500 hover:text-white data-[selected]:bg-red-50",
              {
                "bg-red-500 text-white data-[selected]:bg-red-500": isSameYear(
                  date,
                  value,
                ),
              },
            )}
            onClick={() => onChange(date)}
          >
            {format(date, "yyyy")}
          </Button>
        ))}
    </div>
  );
}

type YearNavigationProps = {
  className?: string;
  value: Date;
  onClick: () => void;
  onChange: (value: Date) => void;
};

function YearNavigation({
  className,
  value,
  onClick,
  onChange,
}: YearNavigationProps) {
  const prevYear = subYears(value, 1);
  const nextYear = addYears(value, 1);

  return (
    <div className={classnames("self-center flex gap-2", className)}>
      <Button
        className="p-2 text-sm rounded hover:bg-red-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50"
        onClick={() => onChange(prevYear)}
        disabled={DATE_MIN > prevYear}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="size-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5 8.25 12l7.5-7.5"
          />
        </svg>
      </Button>

      <Button
        className="py-2 px-4 text-sm font-bold rounded hover:bg-red-50"
        onClick={onClick}
      >
        {format(value, "yyyy")}
      </Button>

      <Button
        className="p-2 text-sm rounded hover:bg-red-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50"
        onClick={() => onChange(nextYear)}
        disabled={DATE_MAX < nextYear}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="size-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m8.25 4.5 7.5 7.5-7.5 7.5"
          />
        </svg>
      </Button>
    </div>
  );
}

type MonthSelectorProps = {
  value: Date;
  onChange: (value: Date) => void;
  range: DateRangeType;
};

function MonthSelector({ value, onChange, range }: MonthSelectorProps) {
  const rangeEnd = endOfYear(value);
  const rangeStart = startOfYear(value);
  return (
    <div className="grid grid-cols-3 gap-2 ">
      {eachMonthOfInterval({ start: rangeStart, end: rangeEnd }).map(
        (date, i) => (
          <Button
            key={i}
            data-selected={isWithinInterval(date, range) ? true : undefined}
            className={classnames(
              "py-2 px-4 text-sm rounded border border-red-500 hover:bg-red-500 data-[selected]:hover:bg-red-500 hover:text-white data-[selected]:bg-red-50",
              {
                "bg-red-500 text-white data-[selected]:bg-red-500": isSameMonth(
                  date,
                  value,
                ),
              },
            )}
            onClick={() => onChange(date)}
          >
            {format(date, "LLLL")}
          </Button>
        ),
      )}
    </div>
  );
}
