import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '\u2302' },
  { path: '/agents', label: 'Agents', icon: '\u2630' },
  { path: '/attestations', label: 'Attestations', icon: '\u2713' },
  { path: '/policies', label: 'Policies', icon: '\u2637' },
  { path: '/certificates', label: 'Certificates', icon: '\u229A' },
  { path: '/alerts', label: 'Alerts', icon: '\u26A0' },
  { path: '/performance', label: 'Performance', icon: '\u2261' },
  { path: '/audit', label: 'Audit Log', icon: '\u2338' },
  { path: '/integrations', label: 'Integrations', icon: '\u2B82' },
  { path: '/settings', label: 'Settings', icon: '\u2699' },
];

export function Sidebar() {
  return (
    <aside className="layout__sidebar">
      <div className="sidebar__logo">
        <span className="sidebar__logo-icon">K</span>
        Keylime Monitor
      </div>
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
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
