import { Space_Grotesk, Gowun_Batang } from "next/font/google";
import "./globals.css";

// 기존 사이트와 동일한 글꼴(숫자: Space Grotesk / 문구: Gowun Batang)
const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

const batang = Gowun_Batang({
  variable: "--font-batang",
  weight: ["400", "700"],
  subsets: ["latin"],
});

// 제목/og:title 은 남은 시간에 따라 달라지므로 app/page.tsx 의 generateMetadata 에서 만든다
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${grotesk.variable} ${batang.variable}`}>
      <body>{children}</body>
    </html>
  );
}
