import React, { useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';

interface MenuProps {
  onSelect: (item: string) => void;
}

const menuItems = [
  { label: 'Start Scan', value: 'scan', description: 'Start a new scan on your codebase. Analyze vulnerabilities, quality issues, and risks.' },
  { label: 'View Settings', value: 'settings', description: 'Configure scan options, ignore patterns, and output preferences.' },
  { label: 'Configure AI', value: 'ai', description: 'Set up AI-enhanced analysis with your API keys and model preferences.' },
  { label: 'View Reports', value: 'reports', description: 'View previous scan reports and historical analysis data.' },
  { label: 'Documentation', value: 'docs', description: 'Access documentation, usage guides, and command reference.' },
  { label: 'Exit', value: 'exit', description: 'Exit VettCode CLI and return to terminal.' },
];

export const Menu: React.FC<MenuProps> = ({ onSelect }) => {
  const [selectedItem, setSelectedItem] = useState(menuItems[0]);

  return (
    <Box flexDirection="column">
      {/* Quick Start Section */}
      <Box flexDirection="column" marginBottom={2}>
        <Text bold color="white" marginBottom={1}>
          Quick Start
        </Text>
        <Text color="gray" dimColor>
          vettcode {'<directory>'}
        </Text>
        <Text color="gray" dimColor>
          vettcode --mode deep
        </Text>
        <Text color="gray" dimColor>
          vettcode --no-ai
        </Text>
      </Box>

      {/* Main Menu Section */}
      <Box flexDirection="row">
        <Box flexDirection="column" width={30}>
          <Text bold color="white" marginBottom={1}>
            Main Menu
          </Text>
          <SelectInput
            items={menuItems}
            onSelect={(item: any) => {
              setSelectedItem(item);
              onSelect(item.value);
            }}
          />
        </Box>
        <Box flexDirection="column" width={25} paddingLeft={2}>
          <Text bold color="white" marginBottom={1}>
            Description
          </Text>
          <Text color="gray" dimColor>
            {selectedItem.description}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
