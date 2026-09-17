// 실행: npm test  (node --test, 의존성 없음)
import test from 'node:test';
import assert from 'node:assert/strict';
import { getState, titleFor } from './schedule.ts';

// KST 시각 문자열 → Date
const kst = (s: string) => new Date(`${s}+09:00`);

test('요일·시각 경계', () => {
  // 2026-09-14 = 월요일
  assert.equal(getState(kst('2026-09-14T08:59:59')).kind, 'PRE');
  const mon9 = getState(kst('2026-09-14T09:00:00'));
  assert.equal(mon9.kind, 'WORK');
  assert.equal(mon9.remainMs, 9 * 3600 * 1000);
  assert.equal(getState(kst('2026-09-14T18:00:00')).kind, 'DONE');
  assert.equal(getState(kst('2026-09-15T18:30:00')).kind, 'WORK'); // 화 19시
  assert.equal(getState(kst('2026-09-16T17:00:00')).kind, 'DONE'); // 수 17시
  assert.equal(getState(kst('2026-09-17T18:59:59')).kind, 'WORK'); // 목 19시
  assert.equal(getState(kst('2026-09-18T16:59:59')).kind, 'WORK'); // 금 17시
  assert.equal(getState(kst('2026-09-19T12:00:00')).kind, 'REST'); // 토
  assert.equal(getState(kst('2026-09-20T12:00:00')).kind, 'REST'); // 일
});

test('UTC 일요일 밤 = KST 월요일 아침', () => {
  assert.equal(getState(new Date('2026-09-13T23:30:00Z')).kind, 'PRE');
  assert.equal(getState(new Date('2026-09-14T00:30:00Z')).kind, 'WORK');
});

test('제목 문구', () => {
  const s = getState(kst('2026-09-14T15:46:15'));
  assert.equal(titleFor(s), '퇴근까지 2시간 13분 남음');
  assert.equal(titleFor(getState(kst('2026-09-14T17:50:00'))), '퇴근까지 10분 남음');
  assert.equal(titleFor(getState(kst('2026-09-14T07:00:00'))), '출근 전 · 오후 6시 퇴근');
  assert.equal(titleFor(getState(kst('2026-09-14T20:00:00'))), '퇴근 완료 🎉');
});
