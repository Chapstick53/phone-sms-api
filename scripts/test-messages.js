const { getMessages, getNumbers } = require('../src/providers/sms24');

function arg(name) {
  const p = process.argv.find(a => a.startsWith(`--${name}=`));
  return p ? p.split('=').slice(1).join('=') : null;
}

(async () => {
  try {
    let phone = arg('phone');
    if (!phone) {
      // pick the first number if not provided
      const nums = await getNumbers();
      if (!nums.length) throw new Error('No numbers found');
      phone = nums[0].phone;
      console.log('No --phone provided. Using:', phone);
    }
    const msgs = await getMessages(phone);
    console.log(`Messages for ${phone}: ${msgs.length}`);
    console.dir(msgs.slice(0, 10), { depth: null });
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
