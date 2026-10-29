import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { AuthGuard } from "../components/AuthGuard";
import { Toaster } from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
}

interface ToastConfig {
  duration: number;
  style: {
    background: string;
    color: string;
  };
}

// Same pairing as the student app, so the two surfaces read as one product.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-plex",
});

const plexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  display: "swap",
  weight: ["600"],
  variable: "--font-serif-plex",
});

export const metadata: Metadata = {
  title: "CODiiN - Admin Dashboard",
  description: "Manage your courses and students on CODiiN platform",
};

export default function RootLayout({ children }: Readonly<LayoutProps>) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexSerif.variable}`}>
      <body className="font-sans antialiased bg-[#F6F8FA]">
        <AuthProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10b981',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
