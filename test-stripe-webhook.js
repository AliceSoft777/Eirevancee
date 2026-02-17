/**
 * Test Stripe Webhook Endpoint
 * 
 * This script helps verify your webhook endpoint is set up correctly.
 * Run: node test-stripe-webhook.js
 */

const https = require('https');

const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/stripe';

console.log('🧪 Testing Stripe Webhook Endpoint...\n');

// Test 1: Check if endpoint exists
console.log('Test 1: Checking if endpoint responds...');
const url = new URL(WEBHOOK_URL);

const options = {
  hostname: url.hostname,
  port: url.port || 3000,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'stripe-signature': 'test_signature'
  }
};

const req = https.request(options, (res) => {
  console.log(`✅ Endpoint responded with status: ${res.statusCode}`);
  
  if (res.statusCode === 400) {
    console.log('✅ Good! Endpoint is rejecting invalid signatures (expected behavior)');
  } else if (res.statusCode === 200) {
    console.log('⚠️  Warning: Endpoint accepted request without valid signature');
  }
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    console.log('\n✅ Webhook endpoint is accessible!');
    console.log('\n📝 Next steps:');
    console.log('1. Update .env.local with your Stripe keys');
    console.log('2. Run: stripe listen --forward-to localhost:3000/api/webhooks/stripe');
    console.log('3. Test with: stripe trigger checkout.session.completed');
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('\n⚠️  Make sure your dev server is running:');
  console.log('   npm run dev');
});

req.write(JSON.stringify({ test: true }));
req.end();
