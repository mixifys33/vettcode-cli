const { chatCompletion, parseJsonFromModel } = require('./dist/cli.js');

const systemPrompt = `You are a security code analysis API that returns ONLY JSON.

ABSOLUTE REQUIREMENTS - FAILURE TO COMPLY WILL BREAK THE SYSTEM:
1. Return ONLY valid JSON - NO explanations, NO markdown, NO text
2. Response format: {"findings": [...]}
3. Each finding needs: severity, category, title, description, file, line, evidence, mitigation, prevention
4. severity values: "critical", "high", "medium", "low", "info"
5. category values: "security", "production", "typing", "logic", "database", "performance", "reliability", "configuration", "code-quality", "react", "other"
6. NO code blocks, NO markdown formatting
7. NO safety disclaimers or notes
8. If no issues: {"findings": []}

Example valid response:
{"findings":[{"severity":"high","category":"security","title":"SQL Injection","description":"User input directly in query","file":"api.ts","line":42,"evidence":"db.query('SELECT * FROM users WHERE id=' + userId)","mitigation":"Use parameterized queries","prevention":"Always use ORM or prepared statements"}]}

Now analyze the code:`;

const userPrompt = `# File: test.ts

function getUserData(userId) {
  const query = "SELECT * FROM users WHERE id=" + userId;
  return db.query(query);
}`;

async function test() {
  try {
    console.log('Testing AI response parsing...\n');
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
    
    const result = await chatCompletion(messages, undefined, 0);
    
    console.log('=== RAW RESPONSE ===');
    console.log(`Model: ${result.model}`);
    console.log(`Length: ${result.content.length} chars\n`);
    console.log(result.content);
    console.log('\n=== PARSING ===');
    
    try {
      const parsed = parseJsonFromModel(result.content);
      console.log('✓ Successfully parsed!');
      console.log('Findings count:', parsed.findings?.length || 0);
      if (parsed.findings && parsed.findings.length > 0) {
        console.log('\nFirst finding:');
        console.log(JSON.stringify(parsed.findings[0], null, 2));
      }
    } catch (error) {
      console.log('✗ Parse failed:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
