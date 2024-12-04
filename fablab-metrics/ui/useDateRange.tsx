"use client";

import { add, endOfMonth, min, startOfMonth, sub } from "date-fns";
import React, { useMemo } from "react";

export type ZoomType = "1y" | "1m";

export type DateRangeType = {
  start: Date;
  end: Date;
};

export type DateRangeContextType = {
  date: Date;
  setDate: (date: Date) => void;

  zoom: ZoomType;
  setZoom: (value: ZoomType) => void;

  range: DateRangeType;
};

const DateRangeContext = React.createContext<DateRangeContextType | null>(null);

export function DateRangeProvider({
  children,
  initialDate,
  initialZoom,
}: {
  children: React.ReactNode;
  initialDate?: Date;
  initialZoom?: ZoomType;
}) {
  const [date, setDate] = React.useState<Date>(initialDate ?? new Date());
  const [zoom, setZoom] = React.useState<ZoomType>(initialZoom ?? "1m");

  const range = useMemo(() => {
    return calculateRange(date, zoom);
  }, [date, zoom]);

  const ctx = React.useMemo(
    () => ({
      date,
      setDate,

      zoom,
      setZoom,

      range,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zoom, date],
  );

  return (
    <DateRangeContext.Provider value={ctx}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const ctx = React.useContext(DateRangeContext);

  if (process.env.NODE_ENV !== "production") {
    if (ctx == null) {
      console.error(
        "DateRangeProvider must be used above component that uses context useDateRange",
      );
    }
  }

  return ctx as DateRangeContextType;
}

function calculateRange(start: Date, zoom: ZoomType) {
  const defaultRange = zoom === "1y" ? { years: 6 } : { months: 6 };

  // 1. Use current `start` date and move `end` date to the future using
  // default range based on selected zoom level.
  // 2. Limit end date by current date.
  const newEnd = min([
    endOfMonth(new Date()),
    endOfMonth(add(start, defaultRange)),
  ]);

  // 3. In case the newEnd was truncated by current date, move start
  // date to the past.
  const newStart = startOfMonth(sub(newEnd, defaultRange));
  return { start: newStart, end: newEnd };
}
