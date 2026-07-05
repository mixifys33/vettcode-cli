import React from 'react';
import { Box, Text } from 'ink';

export const Header: React.FC = () => {
  return (
    <Box flexDirection="column">
      <Box>
        <Text bold color="cyan">
          VettCode
        </Text>
        <Text color="blue" dimColor>
          {' '}
          CLI
        </Text>
      </Box>
      <Text color="white">
        Enterprise-Grade Code Security Scanner
      </Text>
      <Text color="gray" dimColor>
        Advanced static analysis powered by AI
      </Text>
    </Box>
  );
};
