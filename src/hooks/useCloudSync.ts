import { useEffect, useRef, useState } from 'react';
import { supabase, APP_STATE_TABLE } from '../lib/supabase';

export interface CloudBinding {
  key: string;
  value: unknown;
  set: (value: any) => void;
}

export type CloudSyncStatus = 'disabled' | 'connecting' | 'synced' | 'saving' | 'error';

const SAVE_DEBOUNCE_MS = 600;

/**
 * Keeps a set of state values in sync with the Supabase `app_state` table
 * (one row per key, JSON value). On start it loads remote values (seeding the
 * table from local data for keys that don't exist yet), then pushes local
 * changes (debounced) and applies changes made by other clients in realtime.
 */
export function useCloudSync(bindings: CloudBinding[]): CloudSyncStatus {
  const [status, setStatus] = useState<CloudSyncStatus>(supabase ? 'connecting' : 'disabled');
  const [hydrated, setHydrated] = useState(false);

  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;

  // Last JSON known to match the server for each key; avoids echo writes.
  const lastSynced = useRef(new Map<string, string>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const pending = useRef(0);

  const save = async (key: string, json: string) => {
    if (!supabase) return;
    pending.current += 1;
    setStatus('saving');
    const { error } = await supabase
      .from(APP_STATE_TABLE)
      .upsert({ key, value: JSON.parse(json), updated_at: new Date().toISOString() });
    pending.current -= 1;
    if (error) {
      console.error(`[cloud-sync] failed to save "${key}"`, error);
      setStatus('error');
      return;
    }
    lastSynced.current.set(key, json);
    if (pending.current === 0) setStatus('synced');
  };

  // Initial load + realtime subscription
  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let cancelled = false;

    (async () => {
      const keys = bindingsRef.current.map((b) => b.key);
      const { data, error } = await client
        .from(APP_STATE_TABLE)
        .select('key, value')
        .in('key', keys);
      if (cancelled) return;
      if (error) {
        console.error('[cloud-sync] initial load failed; staying on local data', error);
        setStatus('error');
        return;
      }
      const remote = new Map((data ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value]));
      for (const b of bindingsRef.current) {
        if (remote.has(b.key)) {
          const v = remote.get(b.key);
          lastSynced.current.set(b.key, JSON.stringify(v));
          b.set(v);
        } else {
          // First run for this key: seed the cloud with the local value.
          await save(b.key, JSON.stringify(b.value));
        }
      }
      if (cancelled) return;
      setHydrated(true);
      setStatus('synced');
    })();

    const channel = client
      .channel('app_state_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: APP_STATE_TABLE },
        (payload) => {
          const row = payload.new as { key?: string; value?: unknown } | undefined;
          if (!row?.key) return;
          const binding = bindingsRef.current.find((b) => b.key === row.key);
          if (!binding) return;
          const json = JSON.stringify(row.value);
          if (json === lastSynced.current.get(row.key)) return;
          lastSynced.current.set(row.key, json);
          binding.set(row.value);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
      client.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push local changes after hydration
  const serialized = bindings.map((b) => JSON.stringify(b.value));
  useEffect(() => {
    if (!supabase || !hydrated) return;
    bindingsRef.current.forEach((b, i) => {
      const json = serialized[i];
      if (json === lastSynced.current.get(b.key)) return;
      const existing = timers.current.get(b.key);
      if (existing) clearTimeout(existing);
      timers.current.set(
        b.key,
        setTimeout(() => {
          timers.current.delete(b.key);
          save(b.key, json);
        }, SAVE_DEBOUNCE_MS)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, ...serialized]);

  return status;
}
