# ---------- build stage ----------
FROM node:21-alpine AS builder

WORKDIR /repo

# Recreate the monorepo-relative paths so tsconfig "extends" resolves
COPY tsconfig.base.json ./tsconfig.base.json
COPY apps/api/ ./apps/api/

WORKDIR /repo/apps/api
RUN npm install
RUN npm run build

# ---------- runtime stage ----------
FROM node:21-alpine

WORKDIR /app

COPY apps/api/package.json apps/api/package-lock.json* ./
RUN npm install --omit=dev

COPY --from=builder /repo/apps/api/dist dist/

EXPOSE 3001

CMD ["node", "dist/server.js"]
