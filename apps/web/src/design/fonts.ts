import localFont from "next/font/local";

/** 본문·제목 공용 서체. CSS 변수 --font-sans 로 노출된다. */
export const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  weight: "45 920",
  display: "swap",
  variable: "--font-sans",
  fallback: ["-apple-system", "BlinkMacSystemFont", "Apple SD Gothic Neo", "Segoe UI", "Roboto", "Noto Sans KR", "sans-serif"],
});
