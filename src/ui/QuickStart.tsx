import React from 'react';
import { Box, Text } from 'ink';

export const QuickStart: React.FC = () => {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          ⚡ QUICK START
        </Text>
      </Box>

      <Box marginBottom={0}>
        <Text color="green">vettcode &lt;directory&gt;</Text>
        <Text color="gray">          # Scan a directory</Text>
      </Box>
      <Box marginBottom={0}>
        <Text color="green">vettcode &lt;directory&gt; --mode deep</Text>
        <Text color="gray"> # Deep scan mode</Text>
      </Box>
      <Box marginBottom={0}>
        <Text color="green">vettcode &lt;directory&gt; --no-ai</Text>
        <Text color="gray">     # Static analysis only</Text>
      </Box>
      <Box marginBottom={0}>
        <Text color="green">vettcode &lt;directory&gt; -o report.json</Text>
        <Text color="gray"> # Save to file</Text>
      </Box>
      <Box marginBottom={0}>
        <Text color="green">vettcode --help</Text>
        <Text color="gray">                # Show all commands</Text>
      </Box>
      <Box>
        <Text color="green">vettcode --version</Text>
        <Text color="gray">             # Show version</Text>
      </Box>
    </Box>
  );
};
