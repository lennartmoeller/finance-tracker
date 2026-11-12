FROM node:26.13.0-alpine
WORKDIR /app
RUN npm install --global pnpm
COPY . .
RUN pnpm install --frozen-lockfile --filter @finance-tracker/backend...
CMD ["node", "apps/backend/src/main.ts"]
