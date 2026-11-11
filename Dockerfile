FROM node:26.13.0-alpine AS workspace
WORKDIR /app
RUN npm install --global pnpm
COPY . .
RUN pnpm install --frozen-lockfile --filter @finance-tracker/backend...

FROM workspace AS backend
CMD ["node", "apps/backend/src/main.ts"]
