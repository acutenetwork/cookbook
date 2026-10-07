import { logoutAction } from "@cookbook/store/auth/actions";
import { requireUser } from "@cookbook/store/auth/session";
import { AppShell } from "@cookbook/ui/components/app-shell";

import { ClientAcuteProvider } from "@/components/acute-provider";
import { brand, nav } from "@/site";

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_ACUTE_PUBLISHABLE_KEY;

/**
 * Everything in here needs a session, and every page can take a payment, so the
 * one Acute client for the tree is mounted here.
 *
 * The publishable key is public on purpose: it ships in the bundle. What makes it
 * safe is the client app it points at, which only accepts calls from the origins
 * listed on it and caps what any one call can ask for.
 */
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  if (!PUBLISHABLE_KEY) {
    // Loud, not a dead Buy button.
    throw new Error("NEXT_PUBLIC_ACUTE_PUBLISHABLE_KEY is not set, so nobody can pay.");
  }
  const user = await requireUser();

  return (
    <ClientAcuteProvider
      publishableKey={PUBLISHABLE_KEY}
      apiBase={process.env.NEXT_PUBLIC_ACUTE_API_BASE}
    >
      <AppShell
        brand={brand}
        nav={nav}
        user={{ fullName: user.fullName, email: user.email }}
        logoutAction={logoutAction}
      >
        {children}
      </AppShell>
    </ClientAcuteProvider>
  );
}
