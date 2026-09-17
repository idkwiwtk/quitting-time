"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { DAY_NAMES, getState, hourLabel, pad, splitRemain, titleFor } from "@/lib/schedule";

// 개발용 로그 — 배포 빌드에서는 콘솔에 아무것도 남지 않는다
const log = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== "production") console.log("[퇴근]", ...args);
};

// --- 색 보간 헬퍼 (기존 사이트와 동일) ---------------------------------
type RGB = number[];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (c1: RGB, c2: RGB, t: number) => c1.map((v, i) => Math.round(lerp(v, c2[i], t)));
const rgb = (c: RGB) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;

// t = 0 → 시간 여유(맑은 오후)  /  t = 1 → 임박(저무는 노을)
const SKY_TOP = { far: [58, 90, 140], near: [40, 27, 66] };
const SKY_BOT = { far: [126, 168, 205], near: [232, 138, 88] };
const SUN_COL = { far: [255, 244, 208], near: [255, 168, 82] };
const WINDOW = 8 * 3600 * 1000; // 남은 시간을 8시간 창에 맞춰 진행도로 환산

function messageFor(ms: number) {
  const min = ms / 60000;
  if (min > 240) return "아직 여유 있어요.";
  if (min > 60) return "곧이에요. 조금만 더 힘내요.";
  if (min > 10) return "얼마 안 남았어요.";
  if (min > 0) return "거의 다 왔어요!";
  return "퇴근이에요! 오늘도 수고하셨어요. 🎉";
}

// 남은 시간 → 하늘/해/지평선 스타일
function paint(ms: number): { sky: CSSProperties; sun: CSSProperties; horizon: CSSProperties } {
  const t = Math.min(1, Math.max(0, 1 - ms / WINDOW));
  const top = mix(SKY_TOP.far, SKY_TOP.near, t);
  const bot = mix(SKY_BOT.far, SKY_BOT.near, t);
  const sunCol = mix(SUN_COL.far, SUN_COL.near, t);
  const size = lerp(150, 230, t); // 저물수록 커 보이게
  return {
    sky: { background: `linear-gradient(180deg, ${rgb(top)} 0%, ${rgb(bot)} 100%)` },
    sun: {
      top: `${lerp(16, 74, t)}%`, // 위 → 지평선으로 하강
      width: size,
      height: size,
      background: `radial-gradient(circle, ${rgb(sunCol)} 55%, rgba(${sunCol[0]},${sunCol[1]},${sunCol[2]},0) 72%)`,
      boxShadow: `0 0 ${lerp(60, 160, t)}px ${lerp(10, 60, t)}px rgba(${sunCol[0]},${sunCol[1]},${sunCol[2]},${lerp(0.25, 0.55, t)})`,
    },
    horizon: {
      background: `linear-gradient(180deg, rgba(${bot[0]},${bot[1]},${bot[2]},0) 0%, rgba(${bot[0]},${bot[1]},${bot[2]},${lerp(0.15, 0.6, t)}) 100%)`,
    },
  };
}

export default function Countdown() {
  // 첫 렌더는 null(--:--:--) — 서버/클라 시각 차이로 인한 hydration 불일치 방지
  const [now, setNow] = useState<Date | null>(null);
  const lastKind = useRef<string | null>(null); // 직전 tick 의 상태(로그 중복 방지용)

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const state = getState(d);
      // 상태가 바뀔 때만 기록(초마다 찍히지 않도록)
      if (state.kind !== lastKind.current) {
        log("상태 전환", { 이전: lastKind.current, 현재: state.kind, 퇴근시각: state.hour });
        lastKind.current = state.kind;
      }
      // 탭 제목은 og:title 과 같은 분 단위 문구 — 문구가 바뀔 때(분당 1회)만 갱신
      const title = titleFor(state);
      if (document.title !== title) document.title = title;
      setNow(d);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const state = now ? getState(now) : null;
  const dayName = state ? `${DAY_NAMES[state.day]}요일` : "";
  const showClock = !state || state.kind === "WORK" || state.kind === "DONE";

  let eyebrow = " ";
  let message = "";
  let note = "";
  let sceneMs = WINDOW;
  if (state?.kind === "REST") {
    // 쉬는 날: 카운트다운을 감추고 노을만 남긴다
    eyebrow = "오늘은 쉬는 날";
    message = "푹 쉬세요. 🌙";
    note = `${dayName} · 근무 없음`;
    sceneMs = 0;
  } else if (state?.kind === "PRE") {
    // 출근 전(09시 이전): 맑은 하늘만 보여준다
    eyebrow = "출근 전";
    message = "오전 9시부터 카운트다운이 시작돼요.";
    note = `${dayName} · ${hourLabel(state.hour!)} 퇴근`;
  } else if (state) {
    // 퇴근 시각을 지난 뒤: 00:00:00 + 축하 상태 유지
    eyebrow = state.kind === "DONE" ? "오늘 퇴근 완료" : `${hourLabel(state.hour!)}까지`;
    message = messageFor(state.remainMs);
    note = `${dayName} · ${hourLabel(state.hour!)} 퇴근`;
    sceneMs = state.remainMs;
  }

  const scene = paint(sceneMs);
  const { h, m, s } = splitRemain(state?.remainMs ?? 0);

  return (
    <>
      <div id="sky" style={scene.sky} />
      <div id="horizon" style={scene.horizon} />
      <div id="sun" style={scene.sun} />

      <div className={`wrap${state?.kind === "DONE" ? " reached" : ""}`}>
        <div className="eyebrow">{eyebrow}</div>
        <div className={`clock${showClock ? "" : " hidden"}`} role="timer" aria-live="off">
          {state ? pad(h) : "--"}
          <span className="sep">:</span>
          {state ? pad(m) : "--"}
          <span className="sep">:</span>
          {state ? pad(s) : "--"}
        </div>
        <div className={`units${showClock ? "" : " hidden"}`}>
          <span>시간</span>
          <span>분</span>
          <span>초</span>
        </div>
        <div className="message">{message}</div>
      </div>

      {note && <div className="schedule-note">{note}</div>}
    </>
  );
}
