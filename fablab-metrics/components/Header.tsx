import { HeaderFilters } from "fablab-metrics/components/HeaderFilters";
import { Tabs } from "fablab-metrics/components/Tabs";
import { SettingsDialog } from "fablab-metrics/ui/SettingsDialog";
import Image from "next/image";
import React from "react";

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
        <HeaderFilters />
        <div className="justify-self-end">
          <SettingsDialog />
        </div>
      </div>
      <Tabs />
    </div>
  );
}
