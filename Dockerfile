# --- 1) 빌드 -----------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- 2) 실행: standalone 산출물만 복사 ------------------------------------
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
# public/ 은 현재 비어 있어 복사하지 않는다. 정적 파일을 넣게 되면 아래 줄 추가:
# COPY --from=build --chown=node:node /app/public ./public

# 서버 로그(logs/YYYY-MM-DD.log) — non-root 사용자가 쓸 수 있게 미리 만든다
RUN mkdir logs && chown node:node logs
USER node

EXPOSE 3000
CMD ["node", "server.js"]
