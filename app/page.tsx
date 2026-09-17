import type { Metadata } from "next";
import Countdown from "@/components/Countdown";
import { getState, titleFor } from "@/lib/schedule";
import { logger } from "@/lib/logger";

// 요청마다 렌더링해야 제목/og:title 의 남은 시간이 그 시점 값이 된다
export const dynamic = "force-dynamic";

// 크롤러는 JS 를 실행하지 않으므로 og:title 은 서버에서 계산한다
export function generateMetadata(): Metadata {
  const state = getState(new Date());
  const title = titleFor(state); // 탭 제목과 og:title 은 같은 문구
  logger.info("metadata", state.kind, title);

  const description = "평일 퇴근 시각까지 남은 시간을 보여줍니다.";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: "https://time.thisapple.kr",
      siteName: "퇴근까지 남은 시간",
      locale: "ko_KR",
      type: "website",
    },
  };
}

export default function Home() {
  return <Countdown />;
}
