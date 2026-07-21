import React from 'react';
import { Box, Text } from 'ink';
import chalk from 'chalk';

export const Header: React.FC = () => {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text bold color="cyan">
          {'  '}[V]  VettCode{' '}
        </Text>
        <Text color="white" bold>
          CLI
        </Text>
        <Text color="gray"> v1.1.1</Text>
      </Box>
      <Box marginLeft={2}>
        <Text color="white">Enterprise-Grade Code Security Scanner</Text>
      </Box>
      <Box marginLeft={2}>
        <Text color="gray">Advanced static analysis powered by AI</Text>
      </Box>
    </Box>
  );
};
