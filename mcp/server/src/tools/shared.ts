import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Repo root detection
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolve the repo root directory.
 * Walks up from the MCP server directory to find the project root
 * (identified by the presence of a root package.json with the project name).
 *
 * Can be overridden via the REPO_ROOT environment variable.
 */
export function getRepoRoot(): string {
  if (process.env.REPO_ROOT) {
    return path.resolve(process.env.REPO_ROOT);
  }

  // The MCP server dist lives at <repo>/mcp/server/dist/tools/ — go up 4 levels.
  // From src it's <repo>/mcp/server/src/tools/ — also 4 levels.
  const repoRoot = path.resolve(__dirname, "..", "..", "..", "..");

  // Sanity check: the repo root should contain package.json
  const pkgPath = path.join(repoRoot, "package.json");
  if (!fs.existsSync(pkgPath)) {
    throw new Error(`Cannot find repo root (expected package.json at ${pkgPath})`);
  }

  return repoRoot;
}

// ---------------------------------------------------------------------------
// Path safety
// ---------------------------------------------------------------------------

/** Maximum file size to return (256 KB) */
export const MAX_FILE_SIZE = 256 * 1024;

/** Maximum number of search results */
export const MAX_SEARCH_RESULTS = 100;

/**
 * Resolve a user-supplied relative path against the repo root,
 * ensuring the result stays within the repo boundary.
 * Throws if the resolved path escapes the repo root.
 */
export function safePath(repoRoot: string, relativePath: string): string {
  const resolved = path.resolve(repoRoot, relativePath);
  const normalizedRoot = path.resolve(repoRoot) + path.sep;
  const normalizedResolved = path.resolve(resolved);

  // Allow exact root match or paths under root
  if (normalizedResolved !== path.resolve(repoRoot) && !normalizedResolved.startsWith(normalizedRoot)) {
    throw new Error(`Path escapes repo root: ${relativePath}`);
  }

  return normalizedResolved;
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

export function okResponse(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ ok: true, data }, null, 2),
      },
    ],
  };
}

export function errorResponse(error: string) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ ok: false, error }, null, 2),
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Ignore patterns
// ---------------------------------------------------------------------------

/** Directories to skip during listing / searching */
export const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".cache",
  "coverage",
  ".turbo",
]);

/** File extensions to skip during search */
export const IGNORE_EXTENSIONS = new Set([
  ".map",
  ".lock",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".svg",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".mp3",
  ".mp4",
  ".webm",
  ".zip",
  ".tar",
  ".gz",
]);

/** Binary / non-text extensions that must not be patched */
export const BINARY_EXTENSIONS = new Set([
  ...IGNORE_EXTENSIONS,
  ".wasm",
  ".bin",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
]);

// ---------------------------------------------------------------------------
// Shell execution helper (used by verification tools)
// ---------------------------------------------------------------------------

import { execFile } from "node:child_process";

export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/** Max output length returned to the caller (64 KB) */
const MAX_OUTPUT = 64 * 1024;

/**
 * Run a command in the repo root. Returns exit code + trimmed stdout/stderr.
 * Times out after `timeoutMs` (default 60 s). Never throws — always returns a result.
 */
export function runCommand(
  command: string,
  args: string[],
  cwd: string,
  timeoutMs = 60_000,
): Promise<ExecResult> {
  return new Promise((resolve) => {
    const child = execFile(
      command,
      args,
      { cwd, timeout: timeoutMs, maxBuffer: MAX_OUTPUT, shell: true },
      (error, stdout, stderr) => {
        const exitCode =
          error && "code" in error && typeof error.code === "number"
            ? error.code
            : error
              ? 1
              : 0;
        resolve({
          exitCode,
          stdout: (stdout ?? "").trim().slice(0, MAX_OUTPUT),
          stderr: (stderr ?? "").trim().slice(0, MAX_OUTPUT),
        });
      },
    );

    // Safety: kill if it somehow hangs past timeout
    child.on("error", () => {
      resolve({ exitCode: 1, stdout: "", stderr: "Failed to start process" });
    });
  });
}
