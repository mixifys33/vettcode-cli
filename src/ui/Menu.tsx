import React, { useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';

interface MenuProps {
  onSelect: (item: string) => void;
}

const menuItems = [
  { label: 'Scan Current Directory', value: 'scan-current', description: 'Scan the current directory where the terminal is opened.' },
  { label: 'Scan Custom Directory', value: 'scan', description: 'Start a new scan on a custom directory. Analyze vulnerabilities, quality issues, and risks.' },
  { label: 'View Settings', value: 'settings', description: 'Configure scan options, ignore patterns, and output preferences.' },
  { label: 'Configure AI', value: 'ai', description: 'Set up AI-enhanced analysis with your API keys and model preferences.' },
  { label: 'View Reports', value: 'reports', description: 'View previous scan reports and historical analysis data.' },
  { label: 'Documentation', value: 'docs', description: 'Access documentation, usage guides, and command reference.' },
  { label: 'Exit', value: 'exit', description: 'Exit VettCode CLI and return to terminal.' },
];

export const Menu: React.FC<MenuProps> = ({ onSelect }) => {
  const [selectedItem, setSelectedItem] = useState(menuItems[0]);

  return (
    <Box flexDirection="row" width={80}>
      <Box flexDirection="column" width={40}>
        <Text bold color="white" marginBottom={1}>
          Main Menu
        </Text>
        <SelectInput
          items={menuItems}
          onSelect={(item: any) => onSelect(item.value)}
        />
      </Box>
      <Box flexDirection="column" width={40} paddingLeft={2}>
        <Text bold color="white" marginBottom={1}>
          Description
        </Text>
        <Text color="gray" dimColor>
          {selectedItem.description}
        </Text>
      </Box>
    </Box>
  );
};
