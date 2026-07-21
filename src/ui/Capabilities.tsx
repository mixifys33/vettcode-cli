import React from 'react';
import { Box, Text } from 'ink';

interface CapabilityItemProps {
  icon: string;
  title: string;
  description: string;
  color: string;
}

const CapabilityItem: React.FC<CapabilityItemProps> = ({
  icon,
  title,
  description,
  color,
}) => {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color={color}>{icon} </Text>
        <Text bold color={color}>
          {title}
        </Text>
      </Box>
      <Box marginLeft={3}>
        <Text color="gray">{description}</Text>
      </Box>
    </Box>
  );
};

export const Capabilities: React.FC = () => {
  return (
    <Box flexDirection="column" width="45%" paddingRight={2}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          🚀 CAPABILITIES
        </Text>
      </Box>

      <CapabilityItem
        icon="🔒"
        title="Vulnerability Detection"
        description="SQLi, XSS, Command Injection, Secrets, Auth Bypass"
        color="cyan"
      />
      <CapabilityItem
        icon="⚙️"
        title="Code Quality Analysis"
        description="Complexity, Best Practices, Anti-patterns"
        color="yellow"
      />
      <CapabilityItem
        icon="💾"
        title="Database Security"
        description="N+1 Queries, Connection Issues, Timeouts"
        color="yellow"
      />
      <CapabilityItem
        icon="🔍"
        title="Advanced Analysis"
        description="Data Flow Tracking, Control Flow, Reference Graph"
        color="green"
      />
      <CapabilityItem
        icon="📋"
        title="Smart Reporting"
        description="Scoring, Insights, Recommendations, Export"
        color="blue"
      />
    </Box>
  );
};
