// src/app/layout.tsx
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth"; 

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