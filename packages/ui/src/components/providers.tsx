import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

/** Theme and toasts: what every page of every app sits inside. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      {children}
      <Toaster richColors position="top-center" />
    </ThemeProvider>
  );
}
