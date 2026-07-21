import React from 'react';
import { Box, Text } from 'ink';

interface ContextPanelProps {
  selectedMenuIndex: number;
}

const contextMessages: Record<number, { title: string; description: string }> = {
  0: {
    title: 'Start Scan',
    description:
      'Run a scan immediately with current settings.\n\nUses: ' +
      (typeof process !== 'undefined' ? process.cwd() : 'current directory') +
      '\n\nPress [S] or [Enter] to start.',
  },
  1: {
    title: 'View Settings',
    description:
      'Configure scan before running.\n\nAdjust: Scan mode (Quick/Deep), AI on/off,\ntarget directory, and ignore patterns.\n\nPress [Enter] to open settings.',
  },
  2: {
    title: 'Configure AI',
    description:
      'Toggle AI analysis on/off.\n\nAI Enabled: Deep analysis with explanations\nAI Disabled: Fast static analysis only\n\nPress [A] to toggle.',
  },
  3: {
    title: 'View Reports',
    description:
      'View results from previous scans.\n\nSee detailed findings, scores,\nand generate HTML reports.\n\nPress [R] if reports available.',
  },
  4: {
    title: 'Documentation',
    description:
      'Access help and shortcuts.\n\nLearn about features, commands,\nkeyboard shortcuts, and usage.\n\nPress [H] to open.',
  },
  5: {
    title: 'Exit',
    description: 'Exit VettCode CLI.\n\nAll scan results are saved in\n.vettcode-reports/ directory.\n\nPress [Q] to exit.',
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
