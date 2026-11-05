import { useEffect, useState } from 'react';
import { setLiveStatus, setLiveStatusError, clearLiveStatus } from 'fossflow';

const DEFAULT_URL = '/live-status.json';
const DEFAULT_INTERVAL_MS = 30_000;

declare global {
  interface Window {
    FOSSFLOW_LIVE_STATUS_URL?: string;
    FOSSFLOW_LIVE_STATUS_INTERVAL?: number;
  }
}

const resolveConfig = () => {
  const params = new URLSearchParams(window.location.search);
  const url =
    params.get('status') || window.FOSSFLOW_LIVE_STATUS_URL || DEFAULT_URL;
  const intervalSec = Number(params.get('statusInterval'));
  const interval =
    intervalSec > 0
      ? intervalSec * 1000
      : window.FOSSFLOW_LIVE_STATUS_INTERVAL || DEFAULT_INTERVAL_MS;
  return { url, interval, disabled: params.get('status') === 'off' };
};

type FeedState =
  | { kind: 'idle' }
  | { kind: 'ok'; at: Date; count: number }
  | { kind: 'error'; message: string };

/**
 * Polls a JSON status feed and pushes it into the diagram's live status store.
 * Nodes and connectors with a matching "Live status key" are coloured from it.
 * If the feed is missing (404) the diagram just works without live status.
 */
export const LiveStatusFeed = () => {
  const [state, setState] = useState<FeedState>({ kind: 'idle' });

  useEffect(() => {
    const { url, interval, disabled } = resolveConfig();
    if (disabled) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const sep = url.includes('?') ? '&' : '?';
        const res = await fetch(`${url}${sep}_=${Date.now()}`, {
          cache: 'no-store',
          credentials: 'same-origin'
        });
        if (res.status === 404) {
          // No feed configured: stay silent and stop polling.
          clearLiveStatus();
          if (!cancelled) setState({ kind: 'idle' });
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setLiveStatus(json);
        const source = json && typeof json.status === 'object' ? json.status : json;
        if (!cancelled)
          setState({ kind: 'ok', at: new Date(), count: Object.keys(source || {}).length });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setLiveStatusError(message);
        if (!cancelled) setState({ kind: 'error', message });
      }
      if (!cancelled) timer = setTimeout(poll, interval);
    };

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (state.kind === 'idle') return null;

  const isError = state.kind === 'error';
  return (
    <div
      title={isError ? `Stato live non disponibile: ${state.message}` : 'Stato live attivo'}
      style={{
        position: 'fixed',
        left: 12,
        bottom: 12,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.92)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        font: '12px system-ui, sans-serif',
        color: '#333',
        pointerEvents: 'auto'
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: isError ? '#d32f2f' : '#2e7d32'
        }}
      />
      {isError
        ? 'Stato live: errore'
        : `Stato live · ${state.count} voci · ${state.at.toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit'
          })}`}
    </div>
  );
};
