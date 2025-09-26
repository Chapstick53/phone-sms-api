// D:\Phantom Box\phone-sms-api\scripts\test-sms24.js
const { getNumbers, getMessages } = require('../src/providers/sms24');

async function main() {
  const phoneArg = process.argv[2];

  try {
    if (!phoneArg) {
      console.log('📞 No phone number provided. Fetching available numbers...\n');
      const numbers = await getNumbers();
      console.log(`Found ${numbers.length} numbers from sms24:`);
      numbers.slice(0, 10).forEach((n, i) => {
        console.log(`${i + 1}. ${n.phone} → ${n.href}`);
      });
      console.log('\n👉 Run again with: node scripts/test-sms24.js +<phone>');
      return;
    }

    const phone = phoneArg.startsWith('+') ? phoneArg : `+${phoneArg}`;
    console.log(`🔎 Fetching messages for ${phone}...`);
    const messages = await getMessages(phone);

    console.log(`✅ Found ${messages.length} messages\n`);
    for (const msg of messages) {
      console.log(`[${msg.time}] From: ${msg.from}`);
      console.log(`Text: ${msg.text}`);
      if (msg.otp) console.log(`➡️ OTP Detected: ${msg.otp}`);
      console.log('---');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
