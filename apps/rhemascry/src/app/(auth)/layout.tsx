import { Logo } from "@cookbook/ui/components/brand";

import { brand } from "@/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-6 py-6">
        <Logo name={brand.name} icon={brand.icon} />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-20">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
