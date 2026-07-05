import React from 'react';
import { Box, Text } from 'ink';

const capabilities = [
  { title: 'Vulnerability Detection', desc: 'SQLi, XSS, Command Injection, Secrets', color: 'red' },
  { title: 'Code Quality Analysis', desc: 'Magic numbers, deep nesting, dead code', color: 'yellow' },
  { title: 'Database Security', desc: 'N+1 queries, connection limits, timeouts', color: 'blue' },
  { title: 'Advanced Analysis', desc: 'Data flow, control flow, reference graph', color: 'green' },
  { title: 'Smart Reporting', desc: 'Scoring, actionable insights, executive verdict', color: 'cyan' },
];

export const Capabilities: React.FC = () => {
  return (
    <Box flexDirection="column">
      <Text bold color="white" marginBottom={2}>
        Capabilities
      </Text>
      {capabilities.map((cap, index) => (
        <Box key={index} marginBottom={1}>
          <Text color={cap.color as any}>●</Text>
          <Text color="white" bold>
            {' '}
            {cap.title}
          </Text>
          <Text color="gray" dimColor>
            {' '}
            — {cap.desc}
          </Text>
        </Box>
      ))}
    </Box>
  );
};
