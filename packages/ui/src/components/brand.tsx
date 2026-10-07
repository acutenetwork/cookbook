import Link from "next/link";

import { cn } from "../lib/utils";

/** The shop's mark: its icon on the brand colour, then its name. */
export function Logo({
  name,
  icon,
  className,
  href = "/",
}: {
  name: string;
  icon: React.ReactNode;
  className?: string;
  href?: string;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm [&_svg]:size-4.5">
        {icon}
      </span>
      <span className="text-lg font-bold tracking-tight">{name}</span>
    </Link>
  );
}
