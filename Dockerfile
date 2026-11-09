FROM node:26.13.0-alpine AS workspace
WORKDIR /app
RUN npm install --global pnpm
COPY . .
RUN pnpm install --frozen-lockfile --filter @finance-tracker/backend... --filter @finance-tracker/frontend...

FROM workspace AS backend
CMD ["node", "apps/backend/src/main.ts"]

FROM workspace AS frontend-build
RUN pnpm --filter @finance-tracker/frontend build

FROM nginx:1.31.8-alpine AS frontend
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /app/apps/frontend/dist /usr/share/nginx/html
