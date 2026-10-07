import { Receipt, Store, UtensilsCrossed } from "lucide-react";

import type { NavItem } from "@cookbook/ui/components/app-shell";

export const brand = { name: "Chopdeck", icon: <UtensilsCrossed strokeWidth={2.25} /> };

export const nav: NavItem[] = [
  { href: "/", label: "Menu", icon: <Store /> },
  { href: "/orders", label: "Orders", icon: <Receipt /> },
];
