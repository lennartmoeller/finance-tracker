FROM node:26.13.0-alpine
WORKDIR /app
RUN npm install --global pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend apps/backend
COPY banks banks
COPY shared shared
RUN pnpm install --frozen-lockfile --prod --filter @finance-tracker/backend...
CMD ["node", "apps/backend/src/main.ts"]
