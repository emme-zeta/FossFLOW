import { createStore, useStore } from 'zustand';

/**
 * Live status values understood by the renderer.
 * Anything else coming from the feed is normalised to 'unknown'.
 */
export type LiveStatusValue = 'ok' | 'warning' | 'error' | 'running' | 'unknown';

export interface LiveStatusState {
  statuses: Record<string, LiveStatusValue>;
  updatedAt: string | null;
  lastError: string | null;
}

const ALIASES: Record<string, LiveStatusValue> = {
  ok: 'ok',
  up: 'ok',
  success: 'ok',
  green: 'ok',
  online: 'ok',
  warning: 'warning',
  warn: 'warning',
  degraded: 'warning',
  yellow: 'warning',
  stale: 'warning',
  error: 'error',
  down: 'error',
  failed: 'error',
  fail: 'error',
  red: 'error',
  offline: 'error',
  running: 'running',
  active: 'running',
  in_progress: 'running',
  syncing: 'running'
};

export const normaliseLiveStatus = (value: unknown): LiveStatusValue => {
  if (typeof value === 'boolean') return value ? 'ok' : 'error';
  if (typeof value !== 'string') return 'unknown';
  return ALIASES[value.trim().toLowerCase()] ?? 'unknown';
};

/**
 * Accepts either `{ "status": { key: value } }` or a flat `{ key: value }` map.
 * Values can be strings (ok/up/down/error/running…), booleans, or objects
 * with a `status` field.
 */
export const parseLiveStatusFeed = (
  feed: unknown
): Pick<LiveStatusState, 'statuses' | 'updatedAt'> => {
  if (!feed || typeof feed !== 'object') return { statuses: {}, updatedAt: null };
  const obj = feed as Record<string, unknown>;
  const source =
    obj.status && typeof obj.status === 'object'
      ? (obj.status as Record<string, unknown>)
      : obj;

  const statuses: Record<string, LiveStatusValue> = {};
  Object.entries(source).forEach(([key, value]) => {
    if (key === 'updated' || key === 'updatedAt') return;
    if (value && typeof value === 'object' && 'status' in (value as object)) {
      statuses[key] = normaliseLiveStatus((value as { status: unknown }).status);
    } else {
      statuses[key] = normaliseLiveStatus(value);
    }
  });

  const updated = obj.updated ?? obj.updatedAt;
  return { statuses, updatedAt: typeof updated === 'string' ? updated : null };
};

// Module-level store: the live feed is global for the page, so the host app
// can push updates without reaching into the Isoflow providers.
export const liveStatusStore = createStore<LiveStatusState>(() => ({
  statuses: {},
  updatedAt: null,
  lastError: null
}));

export const setLiveStatus = (feed: unknown) => {
  liveStatusStore.setState({ ...parseLiveStatusFeed(feed), lastError: null });
};

export const setLiveStatusError = (message: string | null) => {
  liveStatusStore.setState({ lastError: message });
};

export const clearLiveStatus = () => {
  liveStatusStore.setState({ statuses: {}, updatedAt: null, lastError: null });
};

export const useLiveStatus = (key?: string): LiveStatusValue | null => {
  return useStore(liveStatusStore, (state) => {
    if (!key) return null;
    return state.statuses[key] ?? null;
  });
};

export const useLiveStatusMeta = () => {
  return useStore(liveStatusStore, (state) => {
    return state;
  });
};

export const LIVE_STATUS_COLORS: Record<LiveStatusValue, string> = {
  ok: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  running: '#0288d1',
  unknown: '#9e9e9e'
};
