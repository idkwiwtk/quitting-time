// 서버 전용 로거 — logs/YYYY-MM-DD.log (KST 날짜, 하루에 파일 하나). 클라이언트에서 import 금지.
// ponytail: 의존성 없는 appendFile 로거. 로그 레벨/보관 주기가 필요해지면 pino/winston 으로 교체.
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const DEV = process.env.NODE_ENV !== 'production';
const LOG_DIR = path.join(process.cwd(), 'logs');

async function write(level: string, args: unknown[]) {
  // KST 기준 ISO 문자열: 2026-09-17T18:04:58
  const stamp = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 19);
  const line = `${stamp} [${level}] ${args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')}\n`;
  if (DEV) console.log(line.trimEnd()); // 배포 시 콘솔 출력 없음(파일만)
  try {
    await mkdir(LOG_DIR, { recursive: true });
    await appendFile(path.join(LOG_DIR, `${stamp.slice(0, 10)}.log`), line);
  } catch {
    // 로그 실패가 페이지 응답을 막아서는 안 된다
  }
}

export const logger = {
  info: (...args: unknown[]) => void write('INFO', args),
  error: (...args: unknown[]) => void write('ERROR', args),
};
