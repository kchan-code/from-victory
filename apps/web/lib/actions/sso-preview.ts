"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SSO_PREVIEW_COOKIE } from "@/lib/auth/apple/config";
import { requireAdminParent } from "@/lib/auth/admin";

// FV-674 (spec FV-569 §3 "Flags"): admin-only switch for the `preview` level.
// The cookie value is SSO_PREVIEW_TOKEN itself (the config's constant-time
// check compares it). requireAdminParent() 404s every non-admin.

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function enableSsoPreview(): Promise<void> {
  await requireAdminParent();
  const token = (process.env.SSO_PREVIEW_TOKEN ?? "").trim();
  if (token.length < 32) redirect("/dashboard/admin/sso-preview?status=no-token");
  cookies().set(SSO_PREVIEW_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
  redirect("/dashboard/admin/sso-preview?status=on");
}

export async function disableSsoPreview(): Promise<void> {
  await requireAdminParent();
  cookies().set(SSO_PREVIEW_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  redirect("/dashboard/admin/sso-preview?status=off");
}
