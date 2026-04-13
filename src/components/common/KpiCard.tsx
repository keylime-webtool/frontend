import type { ReactNode } from 'react';
import './common.css';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  icon?: ReactNode;
  onClick?: () => void;
}

export function KpiCard({ title, value, subtitle, variant = 'default', icon, onClick }: KpiCardProps) {
  return (
    <div
      className={`kpi-card kpi-card--${variant}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      <div className="kpi-card__header">
        <span className="kpi-card__title">{title}</span>
        {icon && <span className="kpi-card__icon">{icon}</span>}
      </div>
      <div className="kpi-card__value">{value}</div>
      {subtitle && <div className="kpi-card__subtitle">{subtitle}</div>}
    </div>
  );
}
