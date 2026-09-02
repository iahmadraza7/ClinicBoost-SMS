"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/server/env";
import {
  COOKIE_NAME,
  expiredSessionCookie,
} from "@/server/auth/session";

export async function logout(): Promise<void> {
  const jar = await cookies();
  jar.set(
    COOKIE_NAME,
    "",
    expiredSessionCookie(env.APP_URL.startsWith("https://")),
  );
  redirect("/login");
}
