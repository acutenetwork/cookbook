import { logoutAction } from "@cookbook/store/auth/actions";
import { requireUser } from "@cookbook/store/auth/session";
import { AppShell } from "@cookbook/ui/components/app-shell";

import { brand, nav } from "@/site";

/** Everything in here needs a session. No browser SDK: payments start on the server. */
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <AppShell
      brand={brand}
      nav={nav}
      user={{ fullName: user.fullName, email: user.email }}
      logoutAction={logoutAction}
    >
      {children}
    </AppShell>
  );
}
