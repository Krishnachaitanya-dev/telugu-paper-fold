import { useState, useCallback, useRef } from 'react';
import { searchNews } from '../api/searchService';
import { unwrapOrThrow } from '@/core/result/result';
import type { NewsUpdate } from '@/features/news/model/news.schema';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NewsUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = unwrapOrThrow(await searchNews(q));
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setLoading(false);
  }, []);

  return { query, results, loading, search, clear };
}
