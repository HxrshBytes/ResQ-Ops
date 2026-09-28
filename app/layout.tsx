import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";
import ConditionalNav from "./components/ConditionalNav";

export const metadata: Metadata = {
  title: "ResQ-Ops | AI-Augmented Emergency Operations Center",
  description: "Real-time disaster response powered by AI, GIS, and weather intelligence.",
};

export const viewport: Viewport = {
  themeColor: "#070a12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-void text-primary min-h-screen flex flex-col">
        <ServiceWorkerRegistration />
        <ConditionalNav />
        <div className="flex-1 w-full relative">
          {children}
        </div>
      </body>
    </html>
  );
}
