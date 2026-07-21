import React from 'react';
import { Box, Text } from 'ink';

interface ContextPanelProps {
  selectedMenuIndex: number;
}

const contextMessages: Record<number, { title: string; description: string }> = {
  0: {
    title: 'Start Scan',
    description:
      'Start a new scan on your codebase.\n\nAnalyze for security vulnerabilities,\ncode quality issues, and best practices.',
  },
  1: {
    title: 'View Settings',
    description:
      'Configure scan settings.\n\nAdjust scan mode, ignore patterns,\nand output preferences.',
  },
  2: {
    title: 'Configure AI',
    description:
      'Manage AI analysis settings.\n\nSet API keys, models, and enable/disable\nAI-powered deep analysis.',
  },
  3: {
    title: 'View Reports',
    description:
      'Access scan history and reports.\n\nView previous scan results, compare scores,\nand export findings.',
  },
  4: {
    title: 'Documentation',
    description:
      'Access help and documentation.\n\nLearn about features, commands,\nand best practices.',
  },
  5: {
    title: 'Exit',
    description: 'Exit VettCode CLI.\n\nAll scan results are saved locally.',
  },
};

export const ContextPanel: React.FC<ContextPanelProps> = ({ selectedMenuIndex }) => {
  const context = contextMessages[selectedMenuIndex] || contextMessages[0];

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="gray"
      paddingX={2}
      paddingY={1}
      minHeight={8}
    >
      <Text bold color="cyan">
        {context.title}
      </Text>
      <Box marginTop={1}>
        <Text color="gray">{context.description}</Text>
      </Box>
    </Box>
  );
};
