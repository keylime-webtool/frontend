import type { ReactNode } from 'react';
import './common.css';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  icon?: ReactNode;
}

export function KpiCard({ title, value, subtitle, variant = 'default', icon }: KpiCardProps) {
  return (
    <div className={`kpi-card kpi-card--${variant}`}>
      <div className="kpi-card__header">
        <span className="kpi-card__title">{title}</span>
        {icon && <span className="kpi-card__icon">{icon}</span>}
      </div>
      <div className="kpi-card__value">{value}</div>
      {subtitle && <div className="kpi-card__subtitle">{subtitle}</div>}
    </div>
  );
}
