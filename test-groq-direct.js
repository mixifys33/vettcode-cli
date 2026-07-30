// Test Groq API directly
require('dotenv').config();

async function testGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  
  console.log('Testing Groq API...');
  console.log(`API Key: ${apiKey ? 'SET (' + apiKey.substring(0, 10) + '...)' : 'NOT SET'}`);
  console.log(`Model: ${model}\n`);
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Respond with JSON only: {"test": "value"}' },
          { role: 'user', content: 'Say hello' }
        ],
        temperature: 0,
        max_tokens: 100
      })
    });
    
    console.log(`Status: ${response.status}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log('Error:', JSON.stringify(data, null, 2));
    } else {
      console.log('Success!');
      console.log('Response:', data.choices[0].message.content);
    }
    
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

testGroq();
