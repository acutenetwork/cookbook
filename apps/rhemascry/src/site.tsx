import { Receipt, Soup, Store } from "lucide-react";

import type { NavItem } from "@cookbook/ui/components/app-shell";

export const brand = { name: "Rhemascry", icon: <Soup strokeWidth={2.25} /> };

export const nav: NavItem[] = [
  { href: "/", label: "Menu", icon: <Store /> },
  { href: "/orders", label: "Orders", icon: <Receipt /> },
];
