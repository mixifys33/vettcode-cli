import React from 'react';
import { Box, Text } from 'ink';

interface MenuProps {
  selectedIndex: number;
  items: Array<{ label: string; shortcut?: string }>;
}

export const Menu: React.FC<MenuProps> = ({ selectedIndex, items }) => {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {'['}&gt;{']'} MAIN MENU
        </Text>
      </Box>

      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        return (
          <Box key={index} marginBottom={0}>
            <Text color={isSelected ? 'cyan' : 'white'}>
              {isSelected ? '> ' : '  '}
              {index + 1}. {item.label}
            </Text>
            {item.shortcut && (
              <Text color="gray"> [{item.shortcut}]</Text>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
