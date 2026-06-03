// src/app/layout.tsx
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";

export const metadata = {
  title: "Eventra",
  description: "Eventra SaaS Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}