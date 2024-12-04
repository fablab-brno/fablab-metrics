import { Input } from "@headlessui/react";
import { login } from "fablab-metrics/auth/actions";
import { redirect } from "next/navigation";
import React from "react";

export default function Page() {
  const handleLogin = async (formData: FormData) => {
    "use server";

    const isValid = await login({
      password: (formData.get("password") as string) ?? "",
    });

    if (isValid) {
      redirect("/");
    }
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
              className="mt-3 block w-full rounded-lg border border-gray-800 py-1.5 px-3 text-sm"
            />
          </form>
        </div>
      </div>
    </div>
  );
}
