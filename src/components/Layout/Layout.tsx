import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import './Layout.css';

export function Layout() {
  const [timeRange, setTimeRange] = useState('24h');

  return (
    <div className="layout">
      <Sidebar />
      <div className="layout__main">
        <TopBar selectedTimeRange={timeRange} onTimeRangeChange={setTimeRange} />
        <main className="layout__content">
          <Outlet context={{ timeRange }} />
        </main>
      </div>
    </div>
  );
}
