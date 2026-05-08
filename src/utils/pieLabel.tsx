import type { ReactElement } from 'react';

interface PieLabelConfig {
  colors: Record<string, string>;
  fallbackColor?: string;
  offset?: number;
  fontSize?: number;
  onClick?: (name: string, index: number, e: React.MouseEvent) => void;
  formatLabel?: (name: string, value: number) => string;
  getColor?: (name: string, index: number) => string;
}

interface PieLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  name?: string;
  value?: number;
  index?: number;
}

const RADIAN = Math.PI / 180;

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function createPieLabelRenderer(config: PieLabelConfig) {
  const {
    colors,
    fallbackColor = '#bdbdbd',
    offset = 18,
    fontSize = 12,
    onClick,
    formatLabel = (name, value) => `${titleCase(name)} (${value})`,
    getColor,
  } = config;

  return ({ cx = 0, cy = 0, midAngle = 0, outerRadius = 0, name = '', value = 0, index = 0 }: PieLabelProps): ReactElement => {
    const radius = outerRadius + offset;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const fill = getColor ? getColor(name, index) : (colors[name] ?? fallbackColor);

    return (
      <text
        x={x}
        y={y}
        fill={fill}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={fontSize}
        style={onClick ? { cursor: 'pointer' } : undefined}
        onClick={onClick ? (e) => { e.stopPropagation(); onClick(name, index, e); } : undefined}
      >
        {formatLabel(name, value)}
      </text>
    );
  };
}
