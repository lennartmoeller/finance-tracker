FROM node:26.13.0-alpine AS workspace
WORKDIR /app
RUN npm install --global pnpm
COPY . .
RUN pnpm install --frozen-lockfile --filter @finance-tracker/bank-data-backend...

FROM workspace AS bank-data-backend
CMD ["node", "apps/bank-data-backend/src/main.ts"]
