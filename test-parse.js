// Test different AI response formats

const testResponses = [
  // Test 1: Good JSON response
  {
    name: "Valid JSON",
    content: '{"findings":[{"severity":"high","category":"security","title":"SQL Injection","description":"Test","file":"test.ts","line":10,"evidence":"code","mitigation":"fix","prevention":"prevent"}]}'
  },
  
  // Test 2: JSON with markdown blocks
  {
    name: "JSON in markdown",
    content: '```json\n{"findings":[{"severity":"high","category":"security","title":"SQL Injection","description":"Test","file":"test.ts","line":10,"evidence":"code","mitigation":"fix","prevention":"prevent"}]}\n```'
  },
  
  // Test 3: JSON with explanation before
  {
    name: "JSON with prefix",
    content: 'Here are the findings:\n{"findings":[{"severity":"high","category":"security","title":"SQL Injection","description":"Test","file":"test.ts","line":10,"evidence":"code","mitigation":"fix","prevention":"prevent"}]}'
  },
  
  // Test 4: Empty findings
  {
    name: "Empty findings",
    content: '{"findings":[]}'
  },
  
  // Test 5: Just text (should fail)
  {
    name: "Plain text",
    content: 'No issues found in the code.'
  },
];

// Simple JSON extraction function
function extractJson(raw) {
  const trimmed = raw.trim();
  
  // Remove markdown
  let cleaned = trimmed.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '');
  cleaned = cleaned.trim();
  
  // Find JSON boundaries
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('No JSON found');
  }
  
  const jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);
  return JSON.parse(jsonStr);
}

console.log('Testing JSON extraction...\n');

for (const test of testResponses) {
  try {
    const result = extractJson(test.content);
    const count = result.findings?.length || 0;
    console.log(`✓ ${test.name}: Parsed ${count} findings`);
  } catch (error) {
    console.log(`✗ ${test.name}: ${error.message}`);
  }
}
