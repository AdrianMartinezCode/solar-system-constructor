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

# Install production dependencies (strip local workspace dep for npm install,
# then copy the built package manually so Node can resolve it at runtime).
COPY apps/api/package.json ./
RUN node -e "\
  const fs = require('fs');\
  const p = JSON.parse(fs.readFileSync('package.json','utf8'));\
  delete p.dependencies['@solar/domain'];\
  fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');"
RUN npm install --omit=dev

# Copy the built @solar/domain package so runtime imports resolve correctly.
# Patch its exports map: the source "import" points at ./src/index.ts (for tsx
# dev), but the runtime image only has compiled JS in dist/.
COPY --from=builder /repo/packages/domain/package.json node_modules/@solar/domain/package.json
RUN node -e "\
  const fs = require('fs');\
  const p = JSON.parse(fs.readFileSync('node_modules/@solar/domain/package.json','utf8'));\
  p.exports['.']['import'] = './dist/index.js';\
  fs.writeFileSync('node_modules/@solar/domain/package.json', JSON.stringify(p, null, 2) + '\n');"
COPY --from=builder /repo/packages/domain/dist/ node_modules/@solar/domain/dist/

COPY --from=builder /repo/apps/api/dist dist/

EXPOSE 3001

CMD ["node", "dist/server.js"]
