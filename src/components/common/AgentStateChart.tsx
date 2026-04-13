import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import { agentsApi } from '@/api/agents';

const STATE_COLORS: Record<string, string> = {
  // Pull-mode states
  GET_QUOTE: '#34a853',
  PROVIDE_V: '#4285f4',
  REGISTERED: '#a0c4ff',
  FAILED: '#ea4335',
  RETRY: '#f9ab00',
  TERMINATED: '#9e9e9e',
  INVALID_QUOTE: '#d93025',
  TENANT_FAILED: '#c62828',
  // Push-mode states
  PASS: '#34a853',
  FAIL: '#ea4335',
  PENDING: '#f9ab00',
  UNKNOWN: '#bdbdbd',
};

const PULL_STATES = new Set([
  'GET_QUOTE', 'PROVIDE_V', 'REGISTERED', 'FAILED',
  'RETRY', 'TERMINATED', 'INVALID_QUOTE', 'TENANT_FAILED',
]);

interface StateEntry {
  name: string;
  state: string;
  mode: string;
  value: number;
}

export function AgentStateChart() {
  const navigate = useNavigate();

  const { data: agents } = useQuery({
    queryKey: ['agents', 'dashboard'],
    queryFn: () => agentsApi.list({ per_page: 100 }),
    select: (res) => res.data,
  });

  const agentItems = useMemo(
    () => Array.isArray(agents?.items) ? agents.items : Array.isArray(agents) ? agents : [],
    [agents]
  );

  const stateDistribution: StateEntry[] = useMemo(() => {
    const map = new Map<string, { state: string; mode: string; count: number }>();
    for (const agent of agentItems) {
      const state = agent.state ?? 'UNKNOWN';
      const mode = agent.attestation_mode ?? 'Unknown';
      if (!map.has(state)) {
        map.set(state, { state, mode, count: 0 });
      }
      map.get(state)!.count += 1;
    }
    return Array.from(map.values()).map(({ state, mode, count }) => ({
      name: `${state} (${mode})`,
      state,
      mode,
      value: count,
    }));
  }, [agentItems]);

  if (stateDistribution.length === 0) {
    return (
      <div className="placeholder">
        <div className="placeholder__icon">&#x25EF;</div>
        <div className="placeholder__text">No agents found</div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <defs>
          {stateDistribution
            .filter((entry) => PULL_STATES.has(entry.state))
            .map((entry) => {
              const color = STATE_COLORS[entry.state] ?? STATE_COLORS.UNKNOWN;
              return (
                <pattern
                  key={entry.state}
                  id={`stripe-${entry.state}`}
                  width={6}
                  height={6}
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width={3} height={6} fill="white" />
                  <rect x={3} width={3} height={6} fill={color} />
                </pattern>
              );
            })}
        </defs>
        <Pie
          data={stateDistribution}
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={50}
          dataKey="value"
          nameKey="name"
          label={({ cx, cy, midAngle, outerRadius, name, value, index }: {
            cx: number; cy: number; midAngle: number; outerRadius: number;
            name: string; value: number; index: number;
          }) => {
            const RADIAN = Math.PI / 180;
            const radius = outerRadius + 20;
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);
            return (
              <text
                x={x}
                y={y}
                fill={STATE_COLORS[stateDistribution[index]?.state] ?? STATE_COLORS.UNKNOWN}
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                fontSize={12}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  const entry = stateDistribution[index];
                  if (entry) {
                    navigate(`/agents?state=${encodeURIComponent(entry.state)}`);
                  }
                }}
              >
                {`${name} (${value})`}
              </text>
            );
          }}
          labelLine
          style={{ cursor: 'pointer' }}
          onClick={(_data, index) => {
            const entry = stateDistribution[index];
            if (entry) {
              navigate(`/agents?state=${encodeURIComponent(entry.state)}`);
            }
          }}
        >
          {stateDistribution.map((entry) => (
            <Cell
              key={entry.name}
              fill={
                PULL_STATES.has(entry.state)
                  ? `url(#stripe-${entry.state})`
                  : (STATE_COLORS[entry.state] ?? STATE_COLORS.UNKNOWN)
              }
              stroke={STATE_COLORS[entry.state] ?? STATE_COLORS.UNKNOWN}
              strokeWidth={1}
            />
          ))}
        </Pie>
        <Legend
          content={({ payload }) => {
            if (!payload) return null;
            return (
              <ul style={{
                display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
                listStyle: 'none', padding: 0, margin: '8px 0 0', gap: '8px 16px',
              }}>
                {payload.map((item, index) => {
                  const entry = stateDistribution[index];
                  if (!entry) return null;
                  const isPull = PULL_STATES.has(entry.state);
                  const color = STATE_COLORS[entry.state] ?? STATE_COLORS.UNKNOWN;
                  return (
                    <li
                      key={item.value}
                      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 14 }}
                      onClick={() => navigate(`/agents?state=${encodeURIComponent(entry.state)}`)}
                    >
                      {isPull ? (
                        <svg width={14} height={14} style={{ marginRight: 4, flexShrink: 0 }}>
                          <defs>
                            <pattern
                              id={`legend-stripe-${entry.state}`}
                              width={4}
                              height={4}
                              patternUnits="userSpaceOnUse"
                              patternTransform="rotate(45)"
                            >
                              <rect width={2} height={4} fill="white" />
                              <rect x={2} width={2} height={4} fill={color} />
                            </pattern>
                          </defs>
                          <rect
                            width={14}
                            height={14}
                            fill={`url(#legend-stripe-${entry.state})`}
                            stroke={color}
                            strokeWidth={1}
                          />
                        </svg>
                      ) : (
                        <span style={{
                          width: 14, height: 14, backgroundColor: color,
                          display: 'inline-block', marginRight: 4, borderRadius: 2, flexShrink: 0,
                        }} />
                      )}
                      <span>{item.value}</span>
                    </li>
                  );
                })}
              </ul>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
