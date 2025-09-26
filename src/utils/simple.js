// src/utils/simple.js
const fs = require('fs');
const puppeteer = require('puppeteer');

function toPuppeteerCookies(json, baseUrl = 'https://sms24.me') {
  // Cookie-Editor exports {name, value, domain, path, expirationDate, secure, httpOnly, sameSite}
  return json.map(c => {
    const cookie = {
      name: c.name,
      value: c.value,
      domain: c.domain || new URL(baseUrl).hostname,
      path: c.path || '/',
      httpOnly: !!c.httpOnly,
      secure: !!c.secure
    };
    if (c.expirationDate) cookie.expires = Math.floor(c.expirationDate);
    if (c.sameSite) cookie.sameSite = c.sameSite; // "Lax" | "Strict" | "None"
    // Puppeteer accepts either {domain,path} or {url}, we set url to be safe:
    cookie.url = baseUrl;
    return cookie;
  });
}

(async () => {
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Load cookies BEFORE hitting the protected path
  const raw = fs.readFileSync('D:\\Phantom Box\\phone-sms-api\\cookies\\sms24.json', 'utf8');
  const exported = JSON.parse(raw);
  const cookies = toPuppeteerCookies(exported);

  await page.goto('https://sms24.me', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.setCookie(...cookies);

  // Reload with cookies in place
  await page.goto('https://sms24.me/en/numbers', { waitUntil: 'networkidle2', timeout: 90000 });

  await page.waitForSelector('a[href*="/en/numbers/"]', { timeout: 60000 });
  const numbers = await page.$$eval('a[href*="/en/numbers/"]', els =>
    els.map(a => ({ href: a.href, text: a.innerText.trim() }))
  );
  console.log('Found numbers:', numbers.slice(0, 5));

  // await browser.close();
})();
