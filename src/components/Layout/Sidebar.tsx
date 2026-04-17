import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { performanceApi } from '@/api/performance';
import { settingsApi } from '@/api/settings';
import type { IntegrationService } from '@/types';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '\u2302' },
  { path: '/agents', label: 'Agents', icon: '\u2630' },
  { path: '/policies', label: 'Policies', icon: '\u2637' },
  { path: '/alerts', label: 'Alerts', icon: '\u26A0' },
  { path: '/attestations', label: 'Attestations', icon: '\u2713' },
  { path: '/certificates', label: 'Certificates', icon: '\u229A' },
  { path: '/performance', label: 'Performance', icon: '\u2261' },
  { path: '/audit', label: 'Audit Log', icon: '\u2338' },
  { path: '/integrations', label: 'Integrations', icon: '\u2B82' },
  { path: '/settings', label: 'Settings', icon: '\u2699' },
];

function useHasServiceDown(): boolean {
  const { data: backendStatus } = useQuery({
    queryKey: ['integrations', 'backend-health'],
    queryFn: async () => {
      const start = performance.now();
      try {
        await settingsApi.getKeylime();
        return { status: 'up' as const, latency_ms: Math.round(performance.now() - start) };
      } catch {
        return { status: 'down' as const, latency_ms: Math.round(performance.now() - start) };
      }
    },
    refetchInterval: 1000,
  });

  const backendUp = backendStatus?.status === 'up';

  const { data: services } = useQuery({
    queryKey: ['integrations', 'status'],
    queryFn: () => performanceApi.integrations(),
    select: (res) => res.data,
    refetchInterval: 1000,
    enabled: backendUp,
  });

  if (backendStatus?.status === 'down') return true;
  const svcList: IntegrationService[] = Array.isArray(services) ? services : [];
  return svcList.some((s) => s.status.toLowerCase() === 'down');
}

export function Sidebar() {
  const hasServiceDown = useHasServiceDown();

  return (
    <aside className="layout__sidebar">
      <NavLink to="/" className="sidebar__logo" style={{ textDecoration: 'none' }}>
        <img className="sidebar__logo-icon" src="/keylime-logo.png" alt="Keylime logo" />
        Keylime Dashboard
      </NavLink>
      <nav className="sidebar__nav" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
            }
          >
            <span className="sidebar__link-icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
            {item.path === '/integrations' && hasServiceDown && (
              <span
                className="sidebar__alert-indicator"
                title="One or more services are down"
                aria-label="Service down"
              >
                !
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
