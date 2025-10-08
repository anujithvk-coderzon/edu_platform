import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/materialProtection.css";
import Navbar from "../components/layout/Navbar";
import { AuthProvider } from "../contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import ScrollToTop from "../components/ScrollToTop";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Codiin - Learn & Grow",
  description: "Discover amazing courses and accelerate your learning journey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-gray-50`}>
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
