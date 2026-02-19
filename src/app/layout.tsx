import type { Metadata, Viewport } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kanit",
});

export const metadata: Metadata = {
  title: "HomeyStay — ระบบจัดการห้องเช่า",
  description: "ระบบจัดการห้องเช่ารายเดือน คำนวณค่าไฟ ค่าน้ำอัตโนมัติ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HomeyStay",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${kanit.variable} font-[family-name:var(--font-kanit)] antialiased`}>
        <ServiceWorkerRegistration />
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-64 p-4 pt-16 lg:ml-64 lg:p-8 lg:pt-8 max-lg:ml-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

