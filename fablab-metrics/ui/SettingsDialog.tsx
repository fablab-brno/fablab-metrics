"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { LogoutButton } from "fablab-metrics/auth/LogoutButton";
import { format } from "fablab-metrics/l10n";
import { RefreshIcon } from "fablab-metrics/ui/icons/RefreshIcon";
import { SettingsIcon } from "fablab-metrics/ui/icons/SettingsIcon";
import { useRefresh } from "fablab-metrics/ui/useRefresh";
import { useStatus } from "fablab-metrics/ui/useStatus";
import React from "react";

export function SettingsDialog() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-8 h-8 p-2 rounded-lg hover:bg-gray-100"
      >
        <SettingsIcon />
      </button>

      {isOpen && <SettingsDialogContent setIsOpen={setIsOpen} />}
    </>
  );
}

function SettingsDialogContent({
  setIsOpen,
}: {
  setIsOpen: (value: boolean) => void;
}) {
  const status = useStatus();
  const refresh = useRefresh();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  return (
    <Dialog open onClose={() => setIsOpen(false)} className="relative z-50">
      <div className="fixed inset-0  bg-black opacity-75" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="max-w-lg space-y-4 border bg-white p-12 rounded-lg">
          <DialogTitle className="font-bold">Aktualizace metrik</DialogTitle>
          <p>
            Poslední aktualizace:{" "}
            {status.data?.date != null
              ? format(new Date(status.data?.date), "d. MMMM yyyy, HH:mm")
              : "Nikdy"}
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => handleRefresh()}
              className="px-4 py-2 rounded bg-gray-100 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isRefreshing}
            >
              Aktualizovat{" "}
              {isRefreshing && (
                <RefreshIcon className="animate-spin h-8 w-8 p-2" />
              )}
            </button>
          </div>
          <div className="pt-8 flex justify-between items-center gap-4">
            <LogoutButton className="px-4 py-2 rounded bg-red-500 text-white whitespace-nowrap flex items-center">
              Odhlásit se
            </LogoutButton>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded bg-gray-100"
            >
              Zavřít
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
