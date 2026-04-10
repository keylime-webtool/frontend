import { useState } from 'react';
import { TIME_RANGES } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface TopBarProps {
  selectedTimeRange: string;
  onTimeRangeChange: (value: string) => void;
}

export function TopBar({ selectedTimeRange, onTimeRangeChange }: TopBarProps) {
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?';

  return (
    <header className="layout__topbar">
      <div className="topbar">
        <div className="topbar__search">
          <span className="topbar__search-icon" aria-hidden="true">
            &#x1F50D;
          </span>
          <input
            type="search"
            placeholder="Search agents by UUID, IP, or hostname..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search agents"
          />
        </div>

        <div className="topbar__spacer" />

        <div className="topbar__time-ranges" role="group" aria-label="Time range selector">
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              className={`topbar__time-btn${
                selectedTimeRange === range.value ? ' topbar__time-btn--active' : ''
              }`}
              onClick={() => onTimeRangeChange(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>

        <button className="topbar__notifications" aria-label="Notifications">
          &#x1F514;
          <span className="topbar__badge">0</span>
        </button>

        <button className="topbar__user" aria-label="User menu">
          <span className="topbar__user-avatar">{initials}</span>
          {user?.name || 'Guest'}
        </button>
      </div>
    </header>
  );
}
