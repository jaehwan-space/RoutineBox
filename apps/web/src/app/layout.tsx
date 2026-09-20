import type { Metadata, Viewport } from "next";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ToastProvider } from "@/components/ui";
import { gowunBatang, pretendard } from "@/design/fonts";
import { ThemeProvider, themeInitScript } from "@/design/theme";
import { QueryProvider } from "@/lib/query-client";
import "@/styles/globals.scss";

export const metadata: Metadata = {
  title: { default: "루틴박스", template: "%s | 루틴박스" },
  description: "생활필수품을 내 주기에 맞춰 자동으로 받아보는 정기배송 구독 서비스",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf9f4" },
    { media: "(prefers-color-scheme: dark)", color: "#14160f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${gowunBatang.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <QueryProvider>
            <ToastProvider>
              <Header />
              <main>{children}</main>
              <Footer />
              <BottomTabBar />
            </ToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
