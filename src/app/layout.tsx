// src/app/layout.tsx
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";

export const metadata = {
  title: "Eventra",
  description: "Eventra SaaS Platform",
  icons: {
    icon: "/favicon.ico",      // main favicon
    shortcut: "/favicon.ico",  // for older browsers
    apple: "/apple-icon.png",  // optional (iOS devices)
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}