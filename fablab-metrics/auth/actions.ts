"use server";

import { addWeeks } from "date-fns";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { hashPassword } from "./hasher";

export async function login({ password }: { password: string }) {
  const cookieStore = await cookies();

  const hash = await hashPassword(password);
  const expected = await hashPassword(process.env.AUTH_PASSWORD!);

  if (hash === expected) {
    cookieStore.set({
      name: process.env.COOKIE_AUTH!,
      value: hash,
      httpOnly: true,
      secure: true,
      path: "/",
      sameSite: "strict",
      expires: addWeeks(new Date(), 1),
    });
    return true;
  } else {
    return false;
  }
}

export async function logout() {
  (await cookies()).delete(process.env.COOKIE_AUTH!);
  revalidatePath("/");
}
