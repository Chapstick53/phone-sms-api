// D:\Phantom Box\phone-sms-api\server.js
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { getNumbers, getMessages } = require('./src/providers/sms24'); // adjust path if needed
const ora = require('ora').default;


const app = express();
app.use(cors());
app.use(express.json());

// Rate limiting
app.use(rateLimit({
  windowMs: 10_000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' }
}));

// -----------------------------
// Simple in-memory cache for numbers
// -----------------------------
let numbersCache = { data: null, ts: 0 };
const CACHE_TTL = 30 * 1000; // 30 seconds

async function getNumbersCached() {
  const now = Date.now();
  if (numbersCache.data && (now - numbersCache.ts < CACHE_TTL)) {
    return numbersCache.data;
  }
  const fresh = await getNumbers();
  numbersCache = { data: fresh, ts: now };
  return fresh;
}

// -----------------------------
// 1) Health check
// -----------------------------
app.get('/api/health', (_, res) => {
  res.json({ ok: true });
});

// -----------------------------
// 2) List all numbers (with optional ?country filter)
// -----------------------------
app.get('/api/numbers', async (req, res) => {
  try {
    const { country } = req.query;
    let numbers = await getNumbersCached();

    if (country) {
      const query = country.trim().toLowerCase();
      numbers = numbers.filter(n => {
        const code = (n.countryCode || '').toLowerCase();
        const name = (n.country || '').toLowerCase();
        // allow match on ISO code ("cn") or full name ("china")
        return code.includes(query) || name.includes(query);
      });
    }

    res.json({ provider: 'sms24', count: numbers.length, numbers });
  } catch (e) {
    res.status(502).json({ error: 'upstream_failed', message: e.message });
  }
});

// -----------------------------
// 3) Get messages for a number
// -----------------------------
app.get('/api/numbers/:id/messages', async (req, res) => {
  try {
    const id = req.params.id; // e.g. "12064072001"
    const phone = `+${id.replace(/^\+/, '')}`;
    const messages = await getMessages(phone);

    res.json({ phone, count: messages.length, messages });
  } catch (e) {
    console.error('❌ Error fetching messages:', e.message);
    res.status(502).json({ error: 'upstream_failed', message: e.message });
  }
});

// -----------------------------
// 4) Get latest OTP for a number
// -----------------------------
app.get('/api/numbers/:id/otp', async (req, res) => {
  try {
    const id = req.params.id;
    const phone = `+${id.replace(/^\+/, '')}`;
    const messages = await getMessages(phone);

    const latestOtp = messages.find(m => m.otp); // first with OTP
    if (!latestOtp) {
      return res.json({ phone, otp: null, message: 'No OTP found' });
    }

    res.json({
      phone,
      otp: latestOtp.otp,
      from: latestOtp.from,
      time: latestOtp.time
    });
  } catch (e) {
    console.error('❌ Error fetching OTP:', e.message);
    res.status(502).json({ error: 'upstream_failed', message: e.message });
  }
});

// -----------------------------
// 5) Status endpoint
// -----------------------------
app.get('/api/status', async (_, res) => {
  try {
    const numbers = await getNumbersCached();
    res.json({
      ok: true,
      provider: 'sms24',
      available_numbers: numbers.length,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('❌ Error fetching status:', e.message);
    res.status(502).json({ error: 'upstream_failed', message: e.message });
  }
});

// -----------------------------
// 6) List available countries
// -----------------------------
app.get('/api/countries', async (req, res) => {
  try {
    const numbers = await getNumbersCached();

    // Extract unique countries
    const countriesMap = new Map();
    for (const n of numbers) {
      if (!n.country || !n.countryCode) continue;
      if (!countriesMap.has(n.country.toLowerCase())) {
        countriesMap.set(n.country.toLowerCase(), {
          country: n.country,
          code: n.countryCode,
          count: 0
        });
      }
      countriesMap.get(n.country.toLowerCase()).count++;
    }

    const countries = Array.from(countriesMap.values())
      .sort((a, b) => a.country.localeCompare(b.country));

    res.json({
      provider: 'sms24',
      count: countries.length,
      countries
    });
  } catch (err) {
    console.error('❌ Error fetching countries:', err);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

// -----------------------------
// Start server
// -----------------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 API listening on http://localhost:${PORT}`));
