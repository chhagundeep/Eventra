// src/app/layout.tsx
import "./globals.css"; // This is the only place this should be!
import { AuthProvider } from "@/hooks/useAuth"; 

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0a0a0a]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}