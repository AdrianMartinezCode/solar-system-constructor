# ---------- build stage ----------
FROM node:21-alpine AS builder

WORKDIR /repo

# Copy monorepo root files needed for workspace resolution & TypeScript
COPY package.json tsconfig.base.json ./

# Copy the shared domain package (needed for type-checking the API)
COPY packages/domain/ ./packages/domain/

# Copy the API application
COPY apps/api/ ./apps/api/

# Install all workspace dependencies (npm resolves @solar/domain locally)
RUN npm install --workspace=packages/domain --workspace=apps/api

# Build domain first (API needs its .d.ts declarations), then API
RUN npm run build --workspace=packages/domain
RUN npm run build --workspace=apps/api

# ---------- runtime stage ----------
FROM node:21-alpine

WORKDIR /app

# All @solar/domain imports in the API are "import type" — fully erased at
# compile time.  The runtime JS bundle does not reference the package, so we
# strip it from package.json before installing production dependencies.
COPY apps/api/package.json ./
RUN node -e "\
  const fs = require('fs');\
  const p = JSON.parse(fs.readFileSync('package.json','utf8'));\
  delete p.dependencies['@solar/domain'];\
  fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');"
RUN npm install --omit=dev

COPY --from=builder /repo/apps/api/dist dist/

EXPOSE 3001

CMD ["node", "dist/server.js"]
