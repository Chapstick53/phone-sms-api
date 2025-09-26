const { getNumbers } = require('../src/providers/sms24');

(async () => {
  try {
    const nums = await getNumbers();
    console.log(`Found ${nums.length} numbers`);
    console.log(nums.slice(0, 10)); // preview first 10
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
