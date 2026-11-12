import { AuthShell } from "@/components/auth/AuthShell";
import { disableSsoPreview, enableSsoPreview } from "@/lib/actions/sso-preview";
import { getSsoLevel, isSsoPreviewCookieValid, SSO_PREVIEW_COOKIE } from "@/lib/auth/apple/config";
import { requireAdminParent } from "@/lib/auth/admin";
import { cookies } from "next/headers";

export const metadata = {
  title: "SSO preview (admin)",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const btn =
  "flex w-full items-center justify-center min-h-[48px] rounded-pill border border-hairline bg-charcoal px-6 font-heading font-semibold text-[15px] text-cream hover:border-cream/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx";

export default async function SsoPreviewPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  await requireAdminParent(); // notFound() for non-admins: hidden surface.
  const active = isSsoPreviewCookieValid(cookies().get(SSO_PREVIEW_COOKIE)?.value);

  return (
    <AuthShell
      title="SSO preview"
      subtitle="Shows Apple and Google sign-in in this browser for any surface set to preview."
    >
      {searchParams?.status === "no-token" ? (
        <p role="alert" data-testid="sso-preview-no-token" className="mb-4 font-body text-[14px] text-red-400">
          Preview can&rsquo;t be turned on: SSO_PREVIEW_TOKEN is not set on this
          deployment (it must be at least 32 characters).
        </p>
      ) : null}
      <p className="mb-2 font-body text-[14px] text-cream/80" data-testid="sso-preview-state">
        Preview in this browser: {active ? "on" : "off"}
      </p>
      <p className="mb-6 font-body text-[13px] text-cream/60">
        Flags: web {getSsoLevel("web")}, iOS {getSsoLevel("ios")}, Android {getSsoLevel("android")}.
      </p>
      <form action={enableSsoPreview} className="mb-3">
        <button type="submit" className={btn}>Turn preview on</button>
      </form>
      <form action={disableSsoPreview}>
        <button type="submit" className={btn}>Turn preview off</button>
      </form>
    </AuthShell>
  );
}
