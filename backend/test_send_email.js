require('dotenv').config({ path: '../.env.local' });
const { sendWelcomeEmail } = require('./emailService');

const email = process.argv[2] || process.env.TEST_EMAIL || 'felipisousa604@gmail.com';
const nome = process.argv[3] || process.env.TEST_NAME || 'Teste Scalabrianos';
const password = process.argv[4] || process.env.TEST_PASSWORD || 'Scalab&@10';

async function run() {
  console.log('Sending test welcome email to', email);
  const ok = await sendWelcomeEmail(email, nome, password);
  console.log('Result:', ok);
  process.exit(ok ? 0 : 1);
}

run();
