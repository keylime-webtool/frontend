import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './common.css';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  icon?: ReactNode;
  onClick?: () => void;
  linkTo?: string;
}

export function KpiCard({ title, value, subtitle, variant = 'default', icon, onClick, linkTo }: KpiCardProps) {
  const interactive = !!(linkTo || onClick);
  const className = `kpi-card kpi-card--${variant}${interactive ? ' kpi-card--interactive' : ''}`;

  const content = (
    <>
      <div className="kpi-card__header">
        <span className="kpi-card__title">{title}</span>
        {icon && <span className="kpi-card__icon">{icon}</span>}
      </div>
      <div className="kpi-card__value">{value}</div>
      {subtitle && <div className="kpi-card__subtitle">{subtitle}</div>}
    </>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className={className} aria-label={`${title}: ${value}`}>
        {content}
      </Link>
    );
  }

  return (
    <div
      className={className}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      {content}
    </div>
  );
}
