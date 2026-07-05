import React from 'react';
import { Box, Text } from 'ink';

const stats = [
  { icon: '🔒', title: '350+ Security Patterns', desc: 'Comprehensive detection' },
  { icon: '🧠', title: 'AI-Powered Analysis', desc: 'Deep semantic reasoning' },
  { icon: '✓', title: '<3% False Positives', desc: 'Multi-layer verification' },
  { icon: '🛡️', title: 'Multi-Layer Verification', desc: 'Cross-validation system' },
];

export const StatsPanel: React.FC = () => {
  return (
    <Box flexDirection="column">
      {stats.map((stat, index) => (
        <Box key={index} marginBottom={1}>
          <Text color="yellow">{stat.icon}</Text>
          <Text color="white"> {stat.title}</Text>
          <Text color="gray" dimColor>
            {' '}
            — {stat.desc}
          </Text>
        </Box>
      ))}
    </Box>
  );
};
