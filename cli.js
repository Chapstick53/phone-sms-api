#!/usr/bin/env node
const { program } = require('commander');

const axios = require('axios');
const inquirer = require('inquirer');
const ora = require('ora').default;
const chalk = require('chalk').default;


const API_BASE = process.env.SMS_API || 'http://localhost:4000/api';

// Example wrapper
async function withSpinner(label, fn) {
    const spinner = ora(label).start();
    try {
      const result = await fn();
      spinner.succeed(label);
      return result;
    } catch (err) {
      spinner.fail(chalk.red(`Failed: ${err.message}`));
      throw err;
    }
  }
  

// --- API wrapper ---
const api = {
  health: () => axios.get(`${API_BASE}/health`).then(r => r.data),
  status: () => axios.get(`${API_BASE}/status`).then(r => r.data),
  countries: () => axios.get(`${API_BASE}/countries`).then(r => r.data.countries),
  numbers: (country) => axios.get(`${API_BASE}/numbers`, { params: { country } }).then(r => r.data.numbers),
  messages: (id) => axios.get(`${API_BASE}/numbers/${id}/messages`).then(r => r.data.messages),
  otp: (id) => axios.get(`${API_BASE}/numbers/${id}/otp`).then(r => r.data),
};

// --- Interactive mode ---
async function interactive() {
  console.log("0 =>> You want fake phone numbers my friend?");

  const { proceed } = await inquirer.default.prompt([
    { type: 'confirm', name: 'proceed', message: 'Continue?' }
  ]);
  if (!proceed) return console.log("Goodbye!");

  // choose country
  const countries = await withSpinner("Fetching countries...", () => api.countries());
  const { country } = await inquirer.default.prompt([
    {
      type: 'list',
      name: 'country',
      message: 'Decide in what country you want phone number from?',
      choices: countries.map(c => ({ name: `${c.country} (${c.count})`, value: c.code }))
    }
  ]);

  // choose number
  const numbers = await withSpinner(`Fetching numbers for ${country}...`, () => api.numbers(country));

  if (!numbers.length) {
    return console.log("No numbers found for this country.");
  }

  const { number } = await inquirer.default.prompt([
    {
      type: 'list',
      name: 'number',
      message: 'Select Phone number:',
      choices: numbers.map(n => ({ name: n.phone, value: n.id }))
    }
  ]);

  console.log(`✔ You selected: ${number}`);

  // choose action
  const { action } = await inquirer.default.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What do you want to do?',
      choices: ['View messages', 'Get latest OTP', 'Exit']
    }
  ]);

  if (action === 'View messages') {
    const msgs = await withSpinner(`Fetching messages for ${number}...`, () => api.messages(number));
    console.log(`📩 Messages for ${number}:`);
    msgs.forEach(m => console.log(`[${m.time}] ${m.from}: ${m.text}`));
  } else if (action === 'Get latest OTP') {
    const result = await api.otp(number);
    console.log(`🔑 OTP for ${result.phone}: ${result.otp || "Not found"}`);
  }
}

// --- CLI commands ---
program
  .command('interactive')
  .description('Run interactive CLI')
  .action(interactive);

program
  .command('health')
  .description('Check API health')
  .action(async () => console.log(await api.health()));

program
  .command('status')
  .description('Check API status')
  .action(async () => console.log(await api.status()));

program
  .command('countries')
  .description('List all available countries')
  .action(async () => console.log(await api.countries()));

program
  .command('numbers')
  .option('--country <code>', 'Filter by country code')
  .action(async (opts) => console.log(await api.numbers(opts.country)));

program
  .command('messages')
  .requiredOption('--id <numberId>', 'Phone number ID')
  .action(async (opts) => console.log(await api.messages(opts.id)));

program
  .command('otp')
  .requiredOption('--id <numberId>', 'Phone number ID')
  .action(async (opts) => console.log(await api.otp(opts.id)));

program.parse(process.argv);
