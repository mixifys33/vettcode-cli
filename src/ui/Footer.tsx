import React from 'react';
import { Box, Text } from 'ink';

export const Footer: React.FC = () => {
  return (
    <Box flexDirection="column" justifyContent="flex-end" alignItems="flexEnd">
      <Text color="gray" dimColor>
        Powered by AD-Technologies and AI Enterprises
      </Text>
      <Text color="gray" dimColor>
        Special thanks: Masereka Adorable, Hacker X
      </Text>
    </Box>
  );
};
