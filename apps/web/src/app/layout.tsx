import type { Metadata, Viewport } from "next";
import { Header } from "@/components/layout/Header";
import { ToastProvider } from "@/components/ui";
import { pretendard } from "@/design/fonts";
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
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#101418" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <QueryProvider>
            <ToastProvider>
              <Header />
              <main>{children}</main>
            </ToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
