import React from 'react';
import { Box, Text } from 'ink';

export const Footer: React.FC = () => {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box justifyContent="center">
        <Text color="gray" dimColor>
          ❤️  Powered by AD-Technologies and AI Enterprises
        </Text>
      </Box>
      <Box justifyContent="center">
        <Text color="gray" dimColor>
          Special thanks to Masereka Adorable and Hacker X
        </Text>
      </Box>
      <Box justifyContent="center" marginTop={1}>
        <Text color="gray" dimColor>
          Press [H] for help • [Q] to quit • [↑↓] to navigate • [Enter] to select
        </Text>
      </Box>
    </Box>
  );
};
