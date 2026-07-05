/**
 * Security Patterns - Comprehensive vulnerability detection patterns
 * Adapted from Vettcode-engine for CLI use
 */

import type { FindingCategory } from "./types";

interface Pattern {
  id: string;
  regex: RegExp;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: FindingCategory;
  title: string;
  description: string;
  confidence: "high" | "medium" | "low";
}

// SQL Injection Patterns
export const SQL_INJECTION_PATTERNS: Pattern[] = [
  {
    id: "sql-injection-template-literal",
    regex: /(?:execute|query|raw)\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`/gi,
    severity: "critical",
    category: "security",
    title: "SQL Injection via Template Literal",
    description: "SQL query uses template literal with user input",
    confidence: "high",
  },
  {
    id: "sql-injection-string-concat-plus",
    regex: /(?:execute|query|raw)\s*\(\s*['"][^'"]*['"]\s*\+\s*(?:req\.|params\.|query\.|body\.)/gi,
    severity: "critical",
    category: "security",
    title: "SQL Injection via String Concatenation",
    description: "SQL query concatenates user input directly",
    confidence: "high",
  },
  {
    id: "sql-injection-where-clause",
    regex: /WHERE\s+[^=]+\s*=\s*['"]?\$\{|WHERE\s+[^=]+\s*=\s*['"]\s*\+/gi,
    severity: "critical",
    category: "security",
    title: "SQL Injection in WHERE Clause",
    description: "WHERE clause uses unsanitized user input",
    confidence: "high",
  },
];

// XSS Patterns
export const XSS_PATTERNS: Pattern[] = [
  {
    id: "xss-react-dangerously-set-html",
    regex: /dangerouslySetInnerHTML\s*=\s*\{\s*\{?\s*__html\s*:\s*(?!DOMPurify)/gi,
    severity: "high",
    category: "security",
    title: "XSS via dangerouslySetInnerHTML Without Sanitization",
    description: "React component uses dangerouslySetInnerHTML without DOMPurify",
    confidence: "high",
  },
  {
    id: "xss-dom-innerhtml",
    regex: /\.innerHTML\s*=\s*(?!['"`]|DOMPurify)/gi,
    severity: "high",
    category: "security",
    title: "XSS via innerHTML Assignment",
    description: "Direct innerHTML assignment without sanitization",
    confidence: "medium",
  },
];

// Command Injection Patterns
export const COMMAND_INJECTION_PATTERNS: Pattern[] = [
  {
    id: "command-injection-exec",
    regex: /(?:exec|execSync|spawn|spawnSync)\s*\(\s*[`'"]?[^`'"]*\$\{/gi,
    severity: "critical",
    category: "security",
    title: "Command Injection via exec/spawn",
    description: "Shell command execution with user input",
    confidence: "high",
  },
  {
    id: "command-injection-eval",
    regex: /eval\s*\(\s*(?:req\.|params\.|query\.|body\.)/gi,
    severity: "critical",
    category: "security",
    title: "Code Injection via eval",
    description: "eval() called with user input",
    confidence: "high",
  },
];

// Path Traversal Patterns
export const PATH_TRAVERSAL_PATTERNS: Pattern[] = [
  {
    id: "path-traversal-fs-read",
    regex: /fs\.(?:readFile|readFileSync|createReadStream)\s*\([^)]*(?:req\.|params\.|query\.)/gi,
    severity: "critical",
    category: "security",
    title: "Path Traversal in File Read",
    description: "File read operation with unsanitized user input",
    confidence: "high",
  },
  {
    id: "path-traversal-fs-write",
    regex: /fs\.(?:writeFile|writeFileSync|createWriteStream)\s*\([^)]*(?:req\.|params\.|query\.)/gi,
    severity: "critical",
    category: "security",
    title: "Path Traversal in File Write",
    description: "File write operation with unsanitized user input",
    confidence: "high",
  },
];

// Authentication Patterns
export const AUTH_PATTERNS: Pattern[] = [
  {
    id: "weak-jwt-secret",
    regex: /jwt\.sign\s*\([^)]*,\s*['"](?:secret|password|123|test)['"]/gi,
    severity: "critical",
    category: "security",
    title: "Weak JWT Secret",
    description: "JWT signed with weak or hardcoded secret",
    confidence: "high",
  },
  {
    id: "bcrypt-low-rounds",
    regex: /bcrypt\.hash\w*\s*\([^)]*,\s*([1-9]|10)\s*\)/gi,
    severity: "high",
    category: "security",
    title: "Weak bcrypt Rounds",
    description: "bcrypt rounds < 10 is too weak",
    confidence: "high",
  },
];

// React Patterns
export const REACT_PATTERNS: Pattern[] = [
  {
    id: "react-useeffect-missing-deps",
    regex: /useEffect\s*\([^)]*\)\s*,\s*\[\s*\]/gi,
    severity: "medium",
    category: "react",
    title: "useEffect with Empty Dependency Array",
    description: "useEffect may have missing dependencies",
    confidence: "low",
  },
  {
    id: "react-key-index",
    regex: /key\s*=\s*\{\s*(?:index|i|idx)\s*\}/gi,
    severity: "low",
    category: "react",
    title: "Using Array Index as React Key",
    description: "Array index as key can cause rendering issues",
    confidence: "medium",
  },
];

// Cryptography Patterns
export const CRYPTO_PATTERNS: Pattern[] = [
  {
    id: "crypto-weak-algorithm-md5",
    regex: /crypto\.createHash\s*\(\s*['"]md5['"]\s*\)/gi,
    severity: "high",
    category: "security",
    title: "Weak Cryptographic Algorithm: MD5",
    description: "MD5 is cryptographically broken",
    confidence: "high",
  },
  {
    id: "crypto-weak-algorithm-sha1",
    regex: /crypto\.createHash\s*\(\s*['"]sha1['"]\s*\)/gi,
    severity: "high",
    category: "security",
    title: "Weak Cryptographic Algorithm: SHA1",
    description: "SHA1 is deprecated and insecure",
    confidence: "high",
  },
  {
    id: "crypto-weak-random",
    regex: /Math\.random\s*\(\s*\)/gi,
    severity: "medium",
    category: "security",
    title: "Weak Random Number Generation",
    description: "Math.random() is not cryptographically secure",
    confidence: "low",
  },
];

// Database Patterns
export const DATABASE_PATTERNS: Pattern[] = [
  {
    id: "db-query-no-limit",
    regex: /\.find\s*\(\s*\{[^}]*\}\s*\)(?![\s\S]{0,100}\.limit)/gi,
    severity: "high",
    category: "performance",
    title: "Database Query Without Limit",
    description: "Query can return unlimited results causing OOM",
    confidence: "medium",
  },
  {
    id: "db-n-plus-one",
    regex: /for\s*\([^)]*\)\s*\{[^}]*(?:find|findOne|query)\s*\(/gi,
    severity: "high",
    category: "performance",
    title: "Potential N+1 Query Problem",
    description: "Database query inside loop causes N+1 problem",
    confidence: "low",
  },
];

// Error Handling Patterns
export const ERROR_HANDLING_PATTERNS: Pattern[] = [
  {
    id: "empty-catch-block",
    regex: /catch\s*\([^)]*\)\s*\{\s*\}/gi,
    severity: "medium",
    category: "production",
    title: "Empty Catch Block",
    description: "Error caught but not handled",
    confidence: "high",
  },
  {
    id: "throw-string",
    regex: /throw\s+['"][^'"]+['"]/gi,
    severity: "low",
    category: "code-quality",
    title: "Throwing String Instead of Error",
    description: "Should throw Error objects, not strings",
    confidence: "high",
  },
];

// Security Header Patterns
export const SECURITY_HEADER_PATTERNS: Pattern[] = [
  {
    id: "missing-helmet",
    regex: /express\s*\(\s*\)(?![\s\S]{0,500}helmet)/gi,
    severity: "high",
    category: "security",
    title: "Express App Without Helmet",
    description: "Missing security headers middleware",
    confidence: "medium",
  },
  {
    id: "cors-allow-all",
    regex: /Access-Control-Allow-Origin['"]?\s*:\s*['"]?\*/gi,
    severity: "high",
    category: "security",
    title: "CORS Allows All Origins",
    description: "Wildcard CORS policy is insecure",
    confidence: "high",
  },
];

// Export all patterns combined
export const ALL_PATTERNS: Pattern[] = [
  ...SQL_INJECTION_PATTERNS,
  ...XSS_PATTERNS,
  ...COMMAND_INJECTION_PATTERNS,
  ...PATH_TRAVERSAL_PATTERNS,
  ...AUTH_PATTERNS,
  ...REACT_PATTERNS,
  ...CRYPTO_PATTERNS,
  ...DATABASE_PATTERNS,
  ...ERROR_HANDLING_PATTERNS,
  ...SECURITY_HEADER_PATTERNS,
];
