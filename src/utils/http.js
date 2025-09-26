const fetch = require('node-fetch');

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1'
};

async function politeFetch(url, { timeoutMs = 15000, headers = {}, method = 'GET', body } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      body,
      headers: { ...DEFAULT_HEADERS, ...headers },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function fetchRetry(url, opts = {}, retries = 2, backoffMs = 600) {
  let attempt = 0;
  while (true) {
    try {
      const res = await politeFetch(url, opts);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      if (attempt++ >= retries) throw e;
      await new Promise(r => setTimeout(r, backoffMs * attempt));
    }
  }
}

module.exports = { politeFetch, fetchRetry };
