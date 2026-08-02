import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider, ThemeProvider } from "@/lib/store";
import BottomNav from "@/components/BottomNav";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "刷题宝 - 智能刷题学习平台",
  description: "移动端优先的PWA刷题应用，支持常识判断、逻辑推理、言语理解、数量关系等多种题型",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "刷题宝",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10B981",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('app_theme');if(t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <StoreProvider>
          <main className="flex-1 max-w-[480px] mx-auto w-full pb-20 animate-fade-in">
            {children}
          </main>
          <BottomNav />
          <ServiceWorkerRegister />
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
