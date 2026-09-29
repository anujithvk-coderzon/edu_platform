import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import "./globals.css";
import "../styles/materialProtection.css";
import Navbar from "../components/layout/Navbar";
import { AuthProvider } from "../contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import ScrollToTop from "../components/ScrollToTop";

// UI / body face. Plex Sans holds its shape at 11-15px, where most of this
// interface lives, and its figures are tabular-friendly for progress and counts.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-plex",
});

// Display face, used only for hero headlines. Same superfamily as the sans, so
// the pairing is harmonious by construction rather than by luck.
const plexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  display: "swap",
  weight: ["600"], // the only weight the display face is used at
  variable: "--font-serif-plex",
});

export const metadata: Metadata = {
  title: "CODiiN - Learn & Grow",
  description: "Discover amazing courses and accelerate your learning journey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexSerif.variable}`}>
      <body className="font-sans antialiased bg-white">
        <AuthProvider>
          <ScrollToTop />
          <div className="min-h-screen">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
          </div>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
                maxWidth: '90vw',
              },
              success: {
                duration: 2500,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 3500,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
            containerStyle={{
              top: 80,
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
