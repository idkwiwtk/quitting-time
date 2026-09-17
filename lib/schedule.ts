// 서버(generateMetadata)와 클라이언트(Countdown)가 함께 쓰는 순수 로직.
// 모든 계산은 KST 기준 — 서버가 UTC 여도, 브라우저가 해외여도 같은 결과가 나온다.

// 요일별 퇴근 시각(0=일 … 6=토). 키가 없는 요일 = 근무 없음
export const SCHEDULE: Record<number, number> = { 1: 18, 2: 19, 3: 17, 4: 19, 5: 17 };
export const START_HOUR = 9; // 이 시각 이전의 평일은 '출근 전'
export const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const KST_OFFSET = 9 * 3600 * 1000;
const HOUR = 3600 * 1000;

// REST(근무 없는 날) / PRE(출근 전) / WORK(퇴근 전) / DONE(퇴근 후)
export type State = {
  kind: 'REST' | 'PRE' | 'WORK' | 'DONE';
  day: number;
  hour?: number; // 오늘의 퇴근 시각
  remainMs: number; // WORK 일 때만 양수
};

export const pad = (n: number) => String(n).padStart(2, '0');

// 24시각 → '오후 6시' 같은 한글 12시간제 표기
export function hourLabel(hour: number) {
  return `${hour >= 12 ? '오후' : '오전'} ${hour % 12 || 12}시`;
}

// 현재 시각(KST) 기준 상태 판정
export function getState(now: Date): State {
  // KST 로 밀어둔 뒤 getUTC* 로 읽으면 실행 환경의 타임존과 무관해진다
  const k = new Date(now.getTime() + KST_OFFSET);
  const day = k.getUTCDay();
  const hour = SCHEDULE[day];
  if (hour === undefined) return { kind: 'REST', day, remainMs: 0 };

  const msOfDay = k.getTime() % (24 * HOUR); // KST 자정부터 흐른 시간
  if (msOfDay < START_HOUR * HOUR) return { kind: 'PRE', day, hour, remainMs: 0 };

  const remainMs = hour * HOUR - msOfDay;
  return remainMs > 0 ? { kind: 'WORK', day, hour, remainMs } : { kind: 'DONE', day, hour, remainMs: 0 };
}

// 남은 시간을 시/분/초로 분해
export function splitRemain(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  return { h: Math.floor(totalSec / 3600), m: Math.floor((totalSec % 3600) / 60), s: totalSec % 60 };
}

// 탭 제목·og:title 공용 문구 — 분 단위(초 없음)
export function titleFor(state: State) {
  if (state.kind === 'REST') return '오늘은 쉬는 날';
  if (state.kind === 'PRE') return `출근 전 · ${hourLabel(state.hour!)} 퇴근`;
  if (state.kind === 'DONE') return '퇴근 완료 🎉';
  const { h, m } = splitRemain(state.remainMs);
  return h > 0 ? `퇴근까지 ${h}시간 ${m}분 남음` : `퇴근까지 ${m}분 남음`;
}
