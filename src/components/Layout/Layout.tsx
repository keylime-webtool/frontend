import { useState, useCallback, useRef, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import './Layout.css';

const MIN_SIDEBAR = 180;
const MAX_SIDEBAR = 400;
const DEFAULT_SIDEBAR = 240;

export function Layout() {
  const [timeRange, setTimeRange] = useState('24h');
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR);
  const dragging = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const newWidth = Math.min(MAX_SIDEBAR, Math.max(MIN_SIDEBAR, e.clientX));
      setSidebarWidth(newWidth);
    };
    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const style = { '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties;

  return (
    <div className="layout" style={style}>
      <Sidebar />
      <div className="layout__resize-handle" onMouseDown={onMouseDown} />
      <div className="layout__main">
        <TopBar selectedTimeRange={timeRange} onTimeRangeChange={setTimeRange} />
        <main className="layout__content">
          <Outlet context={{ timeRange }} />
        </main>
      </div>
    </div>
  );
}
