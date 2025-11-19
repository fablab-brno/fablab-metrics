import { DateRangeDropdown } from "fablab-metrics/ui/DateRangeDropdown";
import { DateZoomSelector } from "fablab-metrics/ui/DateZoomSelector";
import { SettingsDialog } from "fablab-metrics/ui/SettingsDialog";
import Image from "next/image";
import React from "react";
import {MemberPackagesDropdown} from "fablab-metrics/ui/MemberPackagesDropdown";

export function Header() {
  return (
    <div className="fixed top-0 inset-x-0 border-b-4 border-red-500 bg-white z-100">
      <div className="container mx-auto grid grid-cols-3 items-center justify-items-stretch">
        <div className="flex items-center">
          <Image
            src="/fablab-logo.svg"
            alt=""
            width="64"
            height="64"
            priority
          />{" "}
          <p className="ml-8 p-4 flex flex-col">
            <span className="font-light">Fablab Brno</span>{" "}
            <small className="uppercase text-sm font-bold">Metrics</small>
          </p>
        </div>
        <div className="justify-self-center flex items-center gap-4">
          <DateZoomSelector />
          <DateRangeDropdown />
          <MemberPackagesDropdown />
        </div>
        <div className="justify-self-end">
          <SettingsDialog />
        </div>
      </div>
    </div>
  );
}
