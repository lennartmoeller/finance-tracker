FROM pgplex/pgschema:1.14.1 AS pgschema

FROM node:26.13.0-alpine
COPY --from=pgschema /usr/local/bin/pgschema /usr/local/bin/pgschema
WORKDIR /app
RUN npm install --global pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY src/backend src/backend
COPY src/shared src/shared
RUN pnpm install --frozen-lockfile --prod --filter @finance-tracker/backend...
CMD ["node", "src/backend/main.ts"]
