"use client";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import classnames from "classnames";
import { format } from "fablab-metrics/l10n";
import { DateSelector } from "fablab-metrics/ui/DateSelector";
import { useDateRange } from "fablab-metrics/ui/useDateRange";
import React from "react";

export function DateRangeDropdown({ className }: { className?: string }) {
  const [label, setLabel] = React.useState("");
  const { range, date, setDate, zoom } = useDateRange();

  React.useEffect(() => {
    setLabel(getSelectedRange({ startDate: range.start, endDate: range.end }));
  }, [range.start, range.end]);

  return (
    <Popover className={classnames(className, "relative")}>
      {label === "" && <div className="bg-gray-100 rounded h-10 w-32" />}
      {label !== "" && (
        <PopoverButton className="rounded-md py-2 px-4 text-sm border border-red-500 hover:bg-red-500 hover:text-white active:bg-red-700 outline-offset-2">
          {label}
        </PopoverButton>
      )}
      <PopoverPanel
        anchor={{
          to: "bottom",
          gap: 10,
        }}
        className="border rounded shadow-lg"
      >
        {({ close }) => (
          <DateSelector
            onLabelChange={setLabel}
            onClose={() => close()}
            value={date}
            onChange={setDate}
            range={range}
            maxZoom={zoom === "1y" ? "year" : "month"}
          />
        )}
      </PopoverPanel>
    </Popover>
  );
}

export const getSelectedRange = (range: any) => {
  const dateFormat = "d. MMMM y";
  return `${format(range.startDate, dateFormat)} – ${format(range.endDate, dateFormat)}`;
};
