import React from 'react';
import { Box, Text } from 'ink';

interface StatItemProps {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, title, subtitle, color }) => {
  return (
    <Box flexDirection="column" marginRight={3} minWidth={16}>
      <Box>
        <Text color={color}>{icon} </Text>
        <Text bold color={color}>
          {title}
        </Text>
      </Box>
      <Box marginLeft={2}>
        <Text color="gray">{subtitle}</Text>
      </Box>
    </Box>
  );
};

export const StatsPanel: React.FC = () => {
  return (
    <Box flexDirection="row" marginBottom={1} paddingX={2}>
      <StatItem
        icon="🛡️"
        title="350+"
        subtitle="Security Patterns"
        color="cyan"
      />
      <StatItem
        icon="🧠"
        title="AI-Powered"
        subtitle="Deep Analysis"
        color="magenta"
      />
      <StatItem
        icon="✓"
        title="<3%"
        subtitle="False Positive Rate"
        color="green"
      />
      <StatItem
        icon="📊"
        title="Multi-Layer"
        subtitle="Verification System"
        color="yellow"
      />
    </Box>
  );
};
