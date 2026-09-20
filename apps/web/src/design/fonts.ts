import { Gowun_Batang } from "next/font/google";
import localFont from "next/font/local";

/** 본문 서체. CSS 변수 --font-sans 로 노출된다. */
export const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  weight: "45 920",
  display: "swap",
  variable: "--font-sans",
  fallback: ["-apple-system", "BlinkMacSystemFont", "Apple SD Gothic Neo", "Segoe UI", "Roboto", "Noto Sans KR", "sans-serif"],
});

/** 브랜드 제목 서체(로고·히어로·섹션 제목). 빌드 시 내려받아 셀프 호스팅된다. CSS 변수 --font-serif. */
export const gowunBatang = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  fallback: ["Apple SD Gothic Neo", "Noto Serif KR", "serif"],
});
