import { useCallback, useEffect, useRef, useState } from 'react';

export function useBoard(reducer, password) {
  const [board, setBoard] = useState({ tasks: [], version: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const current = useRef(board);
  const busy = useRef(false);

  const request = useCallback(async (method, body, signal) => {
    const result = await fetch('/api/board', {
      method, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${password}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await result.json();
    if (!result.ok) throw new Error(data.error || 'Unable to contact the backend.');
    return data;
  }, [password]);

  const reload = useCallback(async (signal) => {
    setLoading(true); setError(''); setReady(false);
    try {
      const data = await request('GET', null, signal);
      if (signal?.aborted) return;
      current.current = data; setBoard(data); setReady(true);
    } catch (error) {
      if (!signal?.aborted) setError(error.message);
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [request]);

  useEffect(() => {
    const controller = new AbortController();
    reload(controller.signal);
    return () => controller.abort();
  }, [reload]);

  async function dispatch(action) {
    if (busy.current || !ready || loading) return false;
    busy.current = true; setSaving(true); setError('');
    try {
      const next = { version: current.current.version, tasks: reducer(current.current.tasks, action) };
      const saved = await request('PUT', next);
      current.current = saved; setBoard(saved);
      return true;
    } catch (error) {
      setError(`${error.message} Your change has not been confirmed. Reload before retrying.`);
      setReady(false);
      return false;
    } finally { busy.current = false; setSaving(false); }
  }

  return { tasks: board.tasks, dispatch, loading, saving, error, ready, reload };
}
