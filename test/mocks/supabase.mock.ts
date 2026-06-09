import { vi } from 'vitest';

export function mockSupabaseRows(rows: unknown[], error: unknown = null) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'neq', 'or', 'order', 'limit', 'maybeSingle', 'single', 'upsert', 'insert', 'update', 'delete', 'not'];
  for (const m of methods) {
    chain[m] = () => chain;
  }
  Object.assign(chain, {
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: rows, error, count: rows.length }).then(resolve),
  });
  return {
    from: vi.fn(() => chain),
    auth: {
      getUser:    vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      signUp:     vi.fn(() => Promise.resolve({ data: { user: { id: 'test-uid' } }, error: null })),
      signInWithPassword: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-uid' } }, error: null })),
    },
    storage: { from: vi.fn(() => ({ upload: vi.fn(), getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/img.jpg' } })) })) },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn(() => ({})) })),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  };
}
