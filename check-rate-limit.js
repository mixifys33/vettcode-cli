// Check OpenRouter rate limit status
require('dotenv').config();

async function checkRateLimit() {
  const apiKey = process.env.OPENROUTER_API_KEY_1;
  
  if (!apiKey) {
    console.log('❌ No API key found in .env');
    return;
  }
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    const data = await response.json();
    
    console.log('\n📊 OpenRouter Account Status:\n');
    console.log(`Label: ${data.data?.label || 'N/A'}`);
    console.log(`Usage: $${data.data?.usage || 0}`);
    console.log(`Limit: ${data.data?.limit ? '$' + data.data.limit : 'Unlimited'}`);
    console.log(`Rate Limit: ${data.data?.rate_limit?.requests || 'N/A'} requests`);
    console.log(`Is Free Tier: ${data.data?.is_free_tier ? 'Yes' : 'No'}`);
    
    if (data.data?.is_free_tier) {
      console.log('\n💡 Tip: Add $1 credit to unlock 1000 free requests/day');
      console.log('   Visit: https://openrouter.ai/credits\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkRateLimit();
