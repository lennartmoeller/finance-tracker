FROM node:26.13.0-alpine
WORKDIR /app
RUN npm install --global pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY src/backend src/backend
COPY src/banks src/banks
COPY src/shared src/shared
RUN pnpm install --frozen-lockfile --prod --filter @finance-tracker/backend... --filter @finance-tracker/banks...
CMD ["node", "src/backend/main.ts"]
