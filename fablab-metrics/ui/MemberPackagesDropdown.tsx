"use client";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import classnames from "classnames";
import React from "react";
import { IMemberPackageType, useMemberPackageFilter } from "fablab-metrics/ui/useMemberPackageFilter";

export function MemberPackagesDropdown({ className }: { className?: string }) {
    const {
        allPackages = [],
        selectedPackages = [],
        addPackage = (packageId: number) => {},
        removePackage = (packageId: number) => {},
        resetPackages = () => {}
    } = useMemberPackageFilter();

    const handleButtonClick = (packageId: number) => {
        if (selectedPackages.find((p: IMemberPackageType) => p.id === packageId)) {
            return removePackage(packageId);
        }

        addPackage(packageId);
    };

    return (
        <Popover className={classnames(className, "relative")}>
            <PopoverButton className={classnames(
              "rounded-md py-2 px-4 text-sm border border-red-500 hover:bg-red-500 hover:text-white active:bg-red-700 outline-offset-2",
              {
                "bg-red-500 text-white": selectedPackages.length !== 0, // aktivní stav
                "bg-gray-100 hover:bg-gray-200": selectedPackages.length === 0, // neaktivní stav
              }
            )}>
                Filtr členství
            </PopoverButton>
          <PopoverPanel
            anchor={{
              to: "bottom",
              gap: 10,
            }}
            className="border rounded shadow-lg p-4 bg-white"
          >
                <div className="flex items-center justify-center p-4">
                    <button
                      id="member-package-reset"
                      onClick={resetPackages}
                      className="py-2 px-4 rounded border transition bg-red-500 text-white"
                    >
                      RESET FILTRU
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {allPackages.map((memberPackage) => (
                    <button
                      id={`member-package-${memberPackage.id}`}
                      key={memberPackage.id}
                      onClick={() => handleButtonClick(memberPackage.id)}
                      className={classnames(
                        "py-2 px-4 rounded border transition",
                        {
                          "bg-red-500 text-white": selectedPackages.find((p: IMemberPackageType) => p.id === memberPackage.id), // aktivní stav
                          "bg-gray-100 hover:bg-gray-200": !selectedPackages.find((p: IMemberPackageType) => p.id === memberPackage.id), // neaktivní stav
                        }
                      )}
                    >
                      {memberPackage.name}
                    </button>
                  ))}
                </div>
          </PopoverPanel>
        </Popover>
);
}