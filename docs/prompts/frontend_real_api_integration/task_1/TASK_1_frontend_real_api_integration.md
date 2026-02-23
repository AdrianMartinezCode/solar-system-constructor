# Task 1 — Add CORS middleware to the backend API

## Objective

Enable the backend Express API to accept cross-origin requests from the Vite frontend dev server (`http://localhost:5173`) by installing and configuring the `cors` npm package.

## Context to read first

- `apps/api/src/app.ts` — the Express app factory where middleware and routes are registered.
- `apps/api/package.json` — current dependencies.
- `compose.yaml` — Docker Compose setup (for awareness; no changes needed).

## Constraints

- Do **not** modify any route handlers or repository code.
- Do **not** change the backend API contract.
- Use the well-maintained `cors` npm package (not hand-rolled headers).
- Keep the allowed-origins list easy to extend (e.g., via an array constant or env var).

## Steps

1. Install the `cors` package and its types:
   ```bash
   npm install cors --workspace=@solar/api
   npm install -D @types/cors --workspace=@solar/api
   ```
2. In `apps/api/src/app.ts`:
   - Import `cors` from `'cors'`.
   - Apply `app.use(cors({ origin: ... }))` **before** `app.use(express.json())`.
   - Set `origin` to at least `['http://localhost:5173']`. A simple approach is a constant array at the top of the file.
3. Verify the build passes.

## Files to create/update

| Action | Path |
|--------|------|
| Update | `apps/api/package.json` (via `npm install`) |
| Update | `apps/api/src/app.ts` |

## Acceptance criteria

- [ ] `cors` is listed in `dependencies` of `apps/api/package.json`.
- [ ] `@types/cors` is listed in `devDependencies`.
- [ ] CORS middleware is applied in `app.ts` before route registration.
- [ ] The origin `http://localhost:5173` is explicitly allowed.
- [ ] `npm run build --workspace=@solar/api` passes without errors.

## Verification

```bash
npm run build --workspace=@solar/api
```

## Notes

- In production, the allowed origins list should be configurable (e.g., via an env var). For now, a hard-coded array in `app.ts` is acceptable — production CORS configuration is out of scope for this CR.
- The `cors` middleware should use default settings for methods and headers (which allow `GET`, `POST`, `PUT`, `DELETE`, `Content-Type`, etc.).
