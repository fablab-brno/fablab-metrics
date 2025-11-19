"use client";

import React from "react";
import {usePackages} from "fablab-metrics/components/usePackages";


export interface IMemberPackageType{
    id: number
    name: string
}

export type MemberPackageFilterContextType = {
  allPackages: IMemberPackageType[];
  selectedPackages: IMemberPackageType[];
  addPackage: (packageId: number) => void;
  removePackage: (packageId: number) => void;
  resetPackages : () => void
};

const MemberPackageFilterContext = React.createContext<MemberPackageFilterContextType | null>(null);


export function MemberPackageFilterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storedMemberPackagesFilter = localStorage.getItem("memberPackagesFilter");
  const [allPackages, setAllPackages] = React.useState<IMemberPackageType[]>([]);
  const [selectedPackages, setSelectedPackages] = React.useState<IMemberPackageType[]>(JSON.parse(storedMemberPackagesFilter ?? "[]"));

  React.useEffect(
    () => {
      localStorage.setItem("memberPackagesFilter", JSON.stringify(selectedPackages));
    },
    [selectedPackages]
  )

  const fetchedPackages = usePackages();

  if (!fetchedPackages.isLoading && allPackages.length === 0) {
    const packages = fetchedPackages.data;
    const replacingPackage = packages.find((p: IMemberPackageType) => p.name.startsWith("Tovaryš"));
    replacingPackage.name = "Tovaryš";

    setAllPackages([ replacingPackage, ...packages.filter((p: IMemberPackageType) => !(p.name.startsWith("Tovaryš") || p.name.startsWith("Předplatné skříňky"))) ]);
  }

  const addPackage = (packageId: number) => {
    if (selectedPackages.find((memberPackage: IMemberPackageType) => memberPackage.id === packageId)) {
      return;
    }

    const newPackage = allPackages.find((p: IMemberPackageType) => p.id === packageId) as IMemberPackageType;
    setSelectedPackages((prev) => ([...prev, newPackage]));
  }

  const removePackage = (packageId: number) => {
    if (!selectedPackages.find((memberPackage: IMemberPackageType) => memberPackage.id === packageId)) {
      return;
    }

    setSelectedPackages((packages) => packages.filter(p => p.id != packageId));
  }

  const resetPackages = () => setSelectedPackages([]);

  const ctx = React.useMemo(
    () => ({
      allPackages,
      selectedPackages,
      addPackage,
      removePackage,
      resetPackages
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allPackages, selectedPackages],
  );

  return (
    <MemberPackageFilterContext.Provider value={ctx}>
      {children}
    </MemberPackageFilterContext.Provider>
  );
}

export function useMemberPackageFilter() {
  const ctx = React.useContext(MemberPackageFilterContext);

  if (process.env.NODE_ENV !== "production") {
    if (ctx == null) {
      console.error(
        "MemberPackageFilterProvider must be used above component that uses context useMemberPackageFilter",
      );
    }
  }

  return ctx as MemberPackageFilterContextType;
}
