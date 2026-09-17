# 퇴근까지 남은 시간 (time.thisapple.kr)

평일 퇴근 시각까지 남은 시간을 화면 · 브라우저 탭 제목 · og:title 에 표시한다.

## 핵심 규칙
- 모든 시각은 **KST(Asia/Seoul)** 기준. 서버 타임존/방문자 브라우저 타임존과 무관 (`lib/schedule.ts`)
- 퇴근 시각: 월 18시 / 화·목 19시 / 수·금 17시, 토·일은 근무 없음 → `SCHEDULE`
- 카운트다운은 09시부터 → `START_HOUR`

| 상태 | 조건 | 화면 | 탭 제목 = og:title |
|---|---|---|---|
| PRE | 평일 09시 이전 | 시계 숨김, '출근 전' | `출근 전 · 오후 6시 퇴근` |
| WORK | 09시 ~ 퇴근 시각 | 카운트다운 | `퇴근까지 2시간 13분 남음` |
| DONE | 퇴근 시각 이후 | 00:00:00 + 축하 | `퇴근 완료 🎉` |
| REST | 토·일 | 시계 숨김, '오늘은 쉬는 날' | `오늘은 쉬는 날` |

- og:title 은 크롤러가 JS 를 실행하지 않으므로 `app/page.tsx` 의 `generateMetadata()` 가 요청 시점에 서버에서 계산한다(`force-dynamic`). 메신저 미리보기는 플랫폼이 캐시하므로 초는 생략.
- 탭 제목도 같은 문구(`titleFor`)를 쓴다. 매초 갱신하지 않고, `components/Countdown.tsx` 가 문구가 바뀔 때(분당 1회)만 `document.title` 을 바꾼다.

## 구조
- `app/` — 라우트만. 컴포넌트는 두지 않는다
- `components/Countdown.tsx` — 화면 전체(하늘/해/시계). 디자인은 기존 정적 사이트를 그대로 이식
- `lib/schedule.ts` — 서버·클라 공용 순수 로직 / `lib/schedule.test.ts` — 경계 검증
- `lib/logger.ts` — 서버 로거
- shadcn/ui·Tailwind 미도입: 클릭 가능한 UI 가 없고 기존 디자인을 그대로 사용. 버튼/링크가 생기면 도입

## 로그
- 서버: `logs/YYYY-MM-DD.log` (KST 날짜, 1일 1파일). 개발 시에만 콘솔에도 출력
- 프론트: `NODE_ENV !== 'production'` 일 때만 `console.log`

## 명령
```
npm run dev     # 개발
npm test        # lib/schedule 검증 (node --test)
npm run build && npm start
```

## 배포 (기존 nginx 정적 서빙 → 프록시로 교체)
1. 서버에서 `npm ci && npm run build`, `next start -p 3000` 을 systemd 또는 pm2 로 상시 실행
2. nginx: `location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; }`
3. 확인: `curl -s https://time.thisapple.kr | grep og:title`
