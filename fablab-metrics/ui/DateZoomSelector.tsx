"use client";

import { Button } from "@headlessui/react";
import classnames from "classnames";
import { ZoomType, useDateRange } from "fablab-metrics/ui/useDateRange";
import React from "react";

const choices: ZoomType[] = ["1m", "1y"];

export function DateZoomSelector() {
  const { zoom, setZoom } = useDateRange();

  return (
    <div>
      {choices.map((choice, i) => (
        <Button
          key={choice}
          className={classnames(
            "py-2 px-4 text-sm text-red-500 border border-red-500 hover:text-white hover:bg-red-500 active:bg-red-700",
            {
              "bg-red-500 text-white": zoom === choice,
              "rounded-l": i === 0,
              "border-l-0": i > 0,
              "rounded-r": i === choices.length - 1,
            },
          )}
          onClick={() => setZoom(choice)}
        >
          {choice}
        </Button>
      ))}
    </div>
  );
}
