// D:\Phantom Box\phone-sms-api\src\utils\sms24.js
const fs = require('fs');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { toIso } = require('../utils/normalize');

const COOKIE_FILE = 'D:\\Phantom Box\\phone-sms-api\\cookies\\sms24.json';
const BASE = 'https://sms24.me';
const LIST_PATH = '/en/numbers';

// -----------------------------
// Load cookies into Puppeteer
// -----------------------------
async function loadCookies(page) {
  if (!fs.existsSync(COOKIE_FILE)) return;
  const raw = fs.readFileSync(COOKIE_FILE, 'utf8');
  const exported = JSON.parse(raw);
  const cookies = exported.map(c => ({
    name: c.name,
    value: c.value,
    domain: c.domain || 'sms24.me',
    path: c.path || '/',
    httpOnly: !!c.httpOnly,
    secure: !!c.secure,
    expires: c.expirationDate ? Math.floor(c.expirationDate) : undefined,
    url: 'https://sms24.me'
  }));
  await page.setCookie(...cookies);
}

// -----------------------------
// Safe navigation with retries
// -----------------------------
async function safeGoto(page, url) {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      return true;
    } catch (err) {
      console.warn(`⚠️ Retry ${i + 1} for ${url}: ${err.message}`);
    }
  }
  throw new Error(`Failed to load ${url} after 3 attempts`);
}

// -----------------------------
// 1) Scrape list of numbers (with country support)
// -----------------------------
async function getNumbers() {
  const seen = new Set();
  const out = [];

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (let pageNum = 1; pageNum <= 5; pageNum++) {
      const url = `${BASE}${LIST_PATH}/page/${pageNum}`;
      const page = await browser.newPage();

      try {
        await safeGoto(page, url);
        await loadCookies(page);

        const html = await page.content();
        const $ = cheerio.load(html);

        $('a.callout[href*="/en/numbers/"]').each((_, a) => {
          const href = $(a).attr('href') || '';
          const m = href.match(/\/en\/numbers\/(\d{7,15})/);
          if (!m) return;

          const digits = m[1];
          const phone = `+${digits}`;
          if (seen.has(phone)) return;

          const countryCode =
            ($(a).find('span.fi').attr('data-flag') || '').trim().toLowerCase() || null;
          const countryName =
            ($(a).find('h5.text-secondary').text() || '').trim() || null;

          seen.add(phone);
          out.push({
            id: digits,
            phone,
            display: phone,
            provider: 'sms24',
            href: href.startsWith('http') ? href : `${BASE}${href}`,
            countryCode,
            country: countryName
          });
        });
      } catch (err) {
        console.warn(`⚠️ Skipping page ${pageNum}: ${err.message}`);
      } finally {
        await page.close();
      }

      // Polite delay (2s) to avoid rate-limiting
      await new Promise(r => setTimeout(r, 2000));
    }
  } finally {
    await browser.close();
  }

  console.log(`✅ Scraped ${out.length} numbers across multiple pages`);
  return out.slice(0, 300);
}

// -----------------------------
// 2) Get messages for a number
// -----------------------------
async function getMessages(phone) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  await safeGoto(page, BASE);
  await loadCookies(page);

  const digits = phone.replace(/^\+/, '');
  await safeGoto(page, `${BASE}/en/numbers/${digits}`);

  const html = await page.content();

  // Debug snapshot
  fs.writeFileSync('debug.html', html, 'utf8');
  console.log('✅ Saved debug.html with raw page content');

  await browser.close();

  return parseMessages(html);
}

// -----------------------------
// 3) Parse messages HTML (robust)
// -----------------------------
function parseMessages(html) {
  const $ = cheerio.load(html);
  const messages = [];

  // --- Primary layout (dl/dt/dd) ---
  $('dl').each((i, dl) => {
    const timeRaw =
      $(dl).find('dt div[data-created]').attr('data-created') ||
      $(dl).find('dt time').attr('datetime') ||
      $(dl).find('dt div').first().text().trim() ||
      Date.now();

    const fromRaw =
      $(dl).find('dd label a').first().text().trim() ||
      $(dl).find('dd label').first().text().trim() ||
      $(dl).find('dd strong').first().text().trim();

    const textRaw =
      $(dl).find('dd span.text-break').first().text().trim() ||
      $(dl).find('dd p').first().text().trim() ||
      $(dl).find('dd').text().trim();

    if (!textRaw) return;

    messages.push({
      id: `msg-${i}`,
      from: cleanFrom(fromRaw),
      text: textRaw,
      otp: extractOtp(textRaw),
      time: toIso(timeRaw)
    });
  });

  // --- Fallback legacy layouts ---
  if (messages.length === 0) {
    $('.list-group-item, .sms-item, .inbox-item, .media, .panel-body, .card-body').each((i, el) => {
      const from =
        cleanFrom(
          $(el).find('.from,.sender,.name').first().text() ||
          $(el).find('strong,b').first().text()
        ) || 'unknown';

      let text =
        $(el).find('.body,.text,.message-text,p').first().text().trim() ||
        $(el).text().trim();

      const cut = text.match(/From:\s*([^\n]+)\s*(.*)$/i);
      if (cut && cut[2]) text = cut[2].trim();

      if (!text) return;
      if (isLikelyNoise(text)) return;

      const time =
        $(el).find('.time,.date,.created').first().text().trim() ||
        Date.now();

      messages.push({
        id: `fb-${Date.now()}-${i}`,
        from,
        text,
        otp: extractOtp(text),
        time: toIso(time)
      });
    });
  }

  // --- If still nothing, save snapshot ---
  if (messages.length === 0) {
    fs.writeFileSync('last_failed.html', html, 'utf8');
    console.warn('⚠️ No messages parsed. Saved last_failed.html for debugging.');
  }

  // Deduplicate
  const uniq = new Map();
  for (const m of messages) {
    const key = `${m.text}|${m.time}`;
    if (!uniq.has(key)) uniq.set(key, m);
  }

  return Array.from(uniq.values()).slice(0, 50);
}

// -----------------------------
// Helpers
// -----------------------------
function extractOtp(text) {
  const match = text.match(/\b\d{4,8}\b/);
  return match ? match[0] : null;
}

function isLikelyNoise(text) {
  if (!text) return true;
  const t = text.trim();
  if (/sms24/i.test(t)) return true;
  if (/new number from/i.test(t)) return true;
  if (/refresh this page/i.test(t)) return true;
  if (/short-?term|rental|aggregator|our platform|pricing model/i.test(t)) return true;
  if (t.length > 200 && !/\b\d{4,8}\b/.test(t)) return true;
  if ((t.match(/\+\d{7,}/g) || []).length >= 2) return true;
  return false;
}

function cleanFrom(fromRaw) {
  const f = (fromRaw || '').trim();
  if (!f) return 'unknown';
  return f.replace(/^From:\s*/i, '').replace(/^\+\d+$/, 'unknown') || 'unknown';
}

// -----------------------------
module.exports = { getNumbers, getMessages };
