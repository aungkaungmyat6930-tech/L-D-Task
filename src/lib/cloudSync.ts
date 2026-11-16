import { useEffect, useRef, useState } from 'react';
import { supabase, STATE_TABLE } from './supabase';

/**
 * One piece of shared app state kept in the Supabase `app_state` table.
 * `value` is the current React state; `apply` receives values loaded from the cloud.
 */
export interface CloudSlice {
  key: string;
  value: unknown;
  apply: (value: any) => void;
}

export type CloudStatus = 'disabled' | 'loading' | 'synced' | 'error';

const SAVE_DELAY_MS = 600;
/** Visitors who are not signed in re-read the public data this often. */
const GUEST_REFRESH_MS = 30_000;

/**
 * Loads every slice from Supabase on start, writes local changes back (debounced),
 * and applies changes made in other browsers via Realtime.
 * localStorage keeps working as an offline cache alongside this.
 */
export function useCloudSync(slices: CloudSlice[], options: { readOnly?: boolean } = {}): CloudStatus {
  const readOnly = !!options.readOnly;
  const [status, setStatus] = useState<CloudStatus>(supabase ? 'loading' : 'disabled');
  const loaded = useRef(false);
  const lastSynced = useRef<Record<string, string>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const slicesRef = useRef(slices);
  slicesRef.current = slices;

  // Initial load + realtime subscription.
  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let cancelled = false;

    const applyRemote = (key: string, value: unknown) => {
      const slice = slicesRef.current.find((s) => s.key === key);
      if (!slice) return;
      const json = JSON.stringify(value);
      if (json === JSON.stringify(slice.value)) {
        lastSynced.current[key] = json;
        return;
      }
      lastSynced.current[key] = json;
      slice.apply(value);
    };

    if (readOnly) {
      // Visitors: read the public (sanitised) data, never write, refresh periodically.
      const loadPublic = async () => {
        const { data, error } = await client.rpc('get_public_state');
        if (cancelled) return;
        if (error) {
          console.error('[supabase] public load failed:', error.message);
          setStatus('error');
          return;
        }
        for (const row of (data ?? []) as { key: string; value: unknown }[]) applyRemote(row.key, row.value);
        setStatus('synced');
      };
      loadPublic();
      const timer = setInterval(loadPublic, GUEST_REFRESH_MS);
      return () => {
        cancelled = true;
        clearInterval(timer);
      };
    }

    (async () => {
      const { data, error } = await client.from(STATE_TABLE).select('key, value');
      if (cancelled) return;
      if (error) {
        console.error('[supabase] load failed:', error.message);
        setStatus('error');
        return;
      }
      const remoteKeys = new Set<string>();
      for (const row of data ?? []) {
        remoteKeys.add(row.key);
        applyRemote(row.key, row.value);
      }
      // First run against an empty database: upload what this browser has.
      const seed = slicesRef.current
        .filter((s) => !remoteKeys.has(s.key))
        .map((s) => ({ key: s.key, value: s.value, updated_at: new Date().toISOString() }));
      if (seed.length) {
        const { error: seedError } = await client.from(STATE_TABLE).upsert(seed);
        if (seedError) console.error('[supabase] initial upload failed:', seedError.message);
        else seed.forEach((r) => (lastSynced.current[r.key] = JSON.stringify(r.value)));
      }
      loaded.current = true;
      setStatus('synced');
    })();

    const channel = client
      .channel('app_state_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: STATE_TABLE },
        (payload: any) => {
          const row = payload.new;
          if (row && row.key !== undefined && row.value !== undefined) applyRemote(row.key, row.value);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      client.removeChannel(channel);
    };
  }, []);

  // Save local changes.
  const deps = slices.map((s) => s.value);
  useEffect(() => {
    if (!supabase || !loaded.current || readOnly) return;
    const client = supabase;
    for (const slice of slicesRef.current) {
      const json = JSON.stringify(slice.value);
      if (lastSynced.current[slice.key] === json) continue;
      clearTimeout(timers.current[slice.key]);
      timers.current[slice.key] = setTimeout(async () => {
        const { error } = await client
          .from(STATE_TABLE)
          .upsert({ key: slice.key, value: slice.value, updated_at: new Date().toISOString() });
        if (error) {
          console.error(`[supabase] save "${slice.key}" failed:`, error.message);
          setStatus('error');
        } else {
          lastSynced.current[slice.key] = json;
          setStatus('synced');
        }
      }, SAVE_DELAY_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, status === 'synced' && loaded.current]);

  return status;
}
