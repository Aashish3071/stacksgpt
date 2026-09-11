import * as React from "react";

/**
 * React's `cache()` dedupes a call for the duration of one server render, but
 * it only exists inside the React Server Components runtime. These modules are
 * also imported by plain Node scripts (migrations, cron jobs, tests), where
 * calling it would throw at import time — so fall back to the bare function
 * there. Scripts are single-shot, so losing per-request dedupe costs nothing.
 */
export function perRequest<A extends unknown[], R>(
  fn: (...args: A) => R,
): (...args: A) => R {
  const cache = (React as { cache?: <T>(f: T) => T }).cache;
  return typeof cache === "function" ? cache(fn) : fn;
}
