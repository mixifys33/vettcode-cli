import React from 'react';
import { Box, Text } from 'ink';

export const Header: React.FC = () => {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text bold color="cyan" fontSize={20}>
          VettCode
        </Text>
        <Text color="gray" dimColor>
          {' '}
          CLI
        </Text>
      </Box>
      <Text color="blue">
        Enterprise-Grade Code Security Scanner
      </Text>
      <Text color="gray" dimColor>
        Advanced static analysis powered by AI
      </Text>
    </Box>
  );
};
