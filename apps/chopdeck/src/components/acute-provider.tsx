"use client";

import { AcuteProvider } from "@acutenetwork/react";

/**
 * The SDK's provider holds React context, and the package does not mark itself as
 * client code, so a server layout cannot render it directly. This file is that
 * boundary and nothing more.
 */
export function ClientAcuteProvider({
  publishableKey,
  apiBase,
  children,
}: {
  publishableKey: string;
  apiBase?: string;
  children: React.ReactNode;
}) {
  return (
    <AcuteProvider publishableKey={publishableKey} apiBase={apiBase}>
      {children}
    </AcuteProvider>
  );
}
