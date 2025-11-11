import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { AppHeader } from "@/components/app-header";
import { DemoAuthProvider } from "@/components/demo-auth-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Profit First Forecasting Platform V2",
  description:
    "A modern forecasting platform leveraging Profit First methodology with Supabase-backed persistence.",
  icons: {
    icon: "/favicon.ico"
  }
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <DemoAuthProvider>
          <div className="min-h-screen bg-slate-50 text-slate-900">
            <AppHeader />
            {children}
          </div>
        </DemoAuthProvider>
      </body>
    </html>
  );
}
