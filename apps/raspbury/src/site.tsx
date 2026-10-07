import { ChefHat, Cherry, Receipt, Store, Wallet } from "lucide-react";

import type { NavItem } from "@cookbook/ui/components/app-shell";

export const brand = { name: "Raspbury", icon: <Cherry strokeWidth={2.25} /> };

export const nav: NavItem[] = [
  { href: "/", label: "Browse", icon: <Store /> },
  { href: "/sell", label: "Sell", icon: <ChefHat /> },
  { href: "/orders", label: "Orders", icon: <Receipt /> },
  { href: "/wallet", label: "Wallet", icon: <Wallet /> },
];
