"use client";

import {
  CloseButton,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useIgnoredMemberPackages } from "fablab-metrics/ui/useIgnoredMemberPackages";
import { AnimatePresence, motion } from "framer-motion";
import { DialogContent } from "next/dist/client/components/react-dev-overlay/internal/components/Dialog";
import React from "react";

export function TrainingsByMemberInfoDialog() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
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
            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
          />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <Dialog
            static
            open={isOpen}
            onClose={() => setIsOpen(false)}
            className="relative z-50"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30"
            />

            {/* Full-screen container to center the panel */}
            <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
              {/* The actual dialog panel  */}
              <DialogPanel
                as={motion.div}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-lg space-y-4 flex flex-col bg-white p-12 pt-4 rounded-lg shadow-lg"
              >
                <CloseButton
                  onClick={() => setIsOpen(false)}
                  className="self-end p-2 rounded-full hover:bg-gray-100"
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
                </CloseButton>

                <DialogTitle className="text-lg font-bold text-gray-800">
                  Počet školení jednotlivých členů
                </DialogTitle>

                <DialogContent>
                  <dl className="grid grid-cols-[min-content,1fr] gap-4">
                    <dt className="font-bold">&gt;1</dt>
                    <dd>Alespoň jedno školení kromě BOZP</dd>
                    <dt className="font-bold">Základní</dt>
                    <dd>
                      Alespoň 3 základní (3D tiskárny, laser, plotr, základy
                      šití) včetně BOZP
                    </dd>
                    <dt className="font-bold">Pokročilé</dt>
                    <dd>Alespoň 3 pokročilé (CNC, vyšívání) včetně BOZP</dd>
                  </dl>
                </DialogContent>
              </DialogPanel>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}
