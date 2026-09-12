import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@/lib/query-client";
import { Header } from "@/components/layout/Header";
import "@/styles/globals.scss";

export const metadata: Metadata = {
  title: { default: "루틴박스", template: "%s | 루틴박스" },
  description: "생활필수품을 내 주기에 맞춰 자동으로 받아보는 정기배송 구독 서비스",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>
          <Header />
          <main>{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
