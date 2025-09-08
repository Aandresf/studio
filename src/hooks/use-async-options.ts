"use client";
import React from 'react';

export function useAsyncOptions(fetcher: (q?: string) => Promise<any[]>) {
  const [options, setOptions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const data = await fetcher(q);
      setOptions(data || []);
    } catch (e) {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  return { options, load, loading, setOptions };
}
