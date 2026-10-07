import { redirect } from "next/navigation";

import { AppShell } from "@cookbook/ui/components/app-shell";

import { logoutAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { brand, nav } from "@/site";

/** Everything inside this group requires a session; the shell renders the nav. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

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
