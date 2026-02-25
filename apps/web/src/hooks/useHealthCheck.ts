/**
 * useHealthCheck — custom hook for live health-check against an API host.
 *
 * Fetches GET {baseUrl}/health and returns a tri-state status:
 *   - 'idle'     — initial state before first check
 *   - 'checking' — request in flight
 *   - 'healthy'  — HTTP 200 with JSON { ok: true }
 *   - 'error'    — network error, non-200, non-JSON, or missing ok
 *
 * Runs immediately on mount. Re-runs with a 500ms debounce when baseUrl changes.
 * Uses AbortController to cancel in-flight requests on cleanup or re-run.
 */

import { useState, useEffect, useRef } from 'react';

export type HealthStatus = 'idle' | 'checking' | 'healthy' | 'error';

export interface HealthCheckResult {
  /** Current health-check status. */
  status: HealthStatus;
  /** Error message when status is 'error'; null otherwise. */
  error: string | null;
}

const DEBOUNCE_MS = 500;
const TIMEOUT_MS = 5000;

export function useHealthCheck(baseUrl: string): HealthCheckResult {
  const [status, setStatus] = useState<HealthStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Track whether this is the initial mount (skip debounce on first run).
  const isFirstRun = useRef(true);

  useEffect(() => {
    let abortController: AbortController | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const runHealthCheck = async () => {
      abortController = new AbortController();

      setStatus('checking');
      setError(null);

      try {
        // Build the abort signal with timeout support.
        let signal: AbortSignal;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        try {
          // Prefer AbortSignal.timeout when available.
          signal = AbortSignal.any([
            abortController.signal,
            AbortSignal.timeout(TIMEOUT_MS),
          ]);
        } catch {
          // Fallback for browsers without AbortSignal.any or AbortSignal.timeout.
          signal = abortController.signal;
          timeoutId = setTimeout(() => abortController?.abort(), TIMEOUT_MS);
        }

        const res = await fetch(`${baseUrl}/health`, { signal });

        // Clear the manual timeout fallback if it was set.
        if (timeoutId !== null) clearTimeout(timeoutId);

        if (!res.ok) {
          setStatus('error');
          setError(`HTTP ${res.status}: ${res.statusText}`);
          return;
        }

        // Try to parse JSON — handle non-JSON 200 responses (REQ-HEALTH-6, Scenario HEALTH-6).
        let body: unknown;
        try {
          body = await res.json();
        } catch {
          setStatus('error');
          setError('Invalid response (not JSON)');
          return;
        }

        // Verify the response contains a truthy `ok` property.
        if (body && typeof body === 'object' && (body as Record<string, unknown>).ok) {
          setStatus('healthy');
          setError(null);
        } else {
          setStatus('error');
          setError('Server reported not OK');
        }
      } catch (err: unknown) {
        // Only update state if this request was not deliberately aborted by cleanup.
        if (abortController?.signal.aborted) return;

        setStatus('error');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    if (isFirstRun.current) {
      // Fire immediately on initial mount (no debounce).
      isFirstRun.current = false;
      runHealthCheck();
    } else {
      // Debounce subsequent baseUrl changes.
      debounceTimer = setTimeout(runHealthCheck, DEBOUNCE_MS);
    }

    return () => {
      // Cancel any pending debounce timer.
      if (debounceTimer !== null) clearTimeout(debounceTimer);

      // Abort any in-flight request.
      if (abortController) abortController.abort();
    };
  }, [baseUrl]);

  return { status, error };
}
