import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kanit",
});

export const metadata: Metadata = {
  title: "HomeyStay — ระบบจัดการห้องเช่า",
  description: "ระบบจัดการห้องเช่ารายเดือน คำนวณค่าไฟ ค่าน้ำอัตโนมัติ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${kanit.variable} font-[family-name:var(--font-kanit)] antialiased`}>
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
