// k6 run scripts/load-test.js
// Install: https://k6.io/docs/getting-started/installation/
import http from 'k6/http';
import { check, sleep } from 'k6';

const SUPABASE_URL = __ENV.SUPABASE_URL;
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '60s', target: 200 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.01'],
  },
};

const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };

export default function () {
  const cutoff = new Date(Date.now() - 86400000).toISOString();

  const feed = http.get(
    `${SUPABASE_URL}/rest/v1/news_updates?select=id,title,created_at&order=created_at.desc&limit=50&created_at=gte.${cutoff}`,
    { headers },
  );
  check(feed, { 'feed 200': (r) => r.status === 200 });

  const politics = http.get(
    `${SUPABASE_URL}/rest/v1/news_updates?select=id,title&category=ilike.Politics&order=created_at.desc&limit=50&created_at=gte.${cutoff}`,
    { headers },
  );
  check(politics, { 'category 200': (r) => r.status === 200 });

  const search = http.get(
    `${SUPABASE_URL}/rest/v1/news_updates?select=id,title&search_vector=wfts.telugu+news&order=created_at.desc&limit=20`,
    { headers },
  );
  check(search, { 'search 200': (r) => r.status === 200 });

  sleep(0.5);
}
