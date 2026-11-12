FROM pgplex/pgschema:1.14.1 AS pgschema

FROM node:26.13.0-alpine AS workspace
WORKDIR /app
RUN npm install --global pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY src/shared src/shared

FROM workspace AS backend
COPY --from=pgschema /usr/local/bin/pgschema /usr/local/bin/pgschema
COPY src/backend src/backend
RUN pnpm install --frozen-lockfile --prod --filter @finance-tracker/backend...
CMD ["node", "src/backend/main.ts"]

FROM workspace AS frontend-build
COPY src/frontend src/frontend
RUN pnpm install --frozen-lockfile --filter @finance-tracker/frontend...
RUN pnpm --filter @finance-tracker/frontend build

FROM nginx:1.31.8-alpine AS frontend
COPY --from=frontend-build /app/src/frontend/dist /usr/share/nginx/html
COPY src/frontend/nginx.conf.template /etc/nginx/templates/default.conf.template
