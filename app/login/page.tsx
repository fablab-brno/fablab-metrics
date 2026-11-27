import { Button, Input } from "@headlessui/react";
import { login } from "fablab-metrics/auth/actions";
import { redirect } from "next/navigation";
import React from "react";

export default function Page({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const handleLogin = async (formData: FormData) => {
    "use server";

    const isValid = await login({
      password: (formData.get("password") as string) ?? "",
    });

    redirect(isValid ? "/" : "/login?error=1");
  };
  return (
    <div className="fixed inset-0 z-10 bg-black opacity-75">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-6">
          <form className="text-center" action={handleLogin}>
            Zadejte heslo pro přístup k statistikám
            <Input
              name="password"
              type="password"
              autoFocus
              className="mt-3 block w-full rounded-lg border border-gray-800 py-1.5 px-3 text-sm"
            />
            {searchParams.error && (
              <p className="mt-2 text-sm text-red-600">Nesprávné heslo.</p>
            )}
            <Button
              type="submit"
              className="mt-3 w-full rounded-lg bg-red-500 py-1.5 px-3 text-sm font-semibold text-white hover:bg-red-600"
            >
              Přihlásit
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
