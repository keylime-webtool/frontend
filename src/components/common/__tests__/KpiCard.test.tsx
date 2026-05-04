import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { KpiCard } from '../KpiCard';

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('KpiCard', () => {
  it('renders title and value', () => {
    wrap(<KpiCard title="Agents" value={42} />);
    expect(screen.getByText('Agents')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    wrap(<KpiCard title="T" value={0} subtitle="last 24h" />);
    expect(screen.getByText('last 24h')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    wrap(<KpiCard title="T" value={0} icon={<span data-testid="icon">!</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies variant class', () => {
    const { container } = wrap(<KpiCard title="T" value={0} variant="danger" />);
    expect(container.querySelector('.kpi-card--danger')).toBeTruthy();
  });

  it('renders as link when linkTo is provided', () => {
    wrap(<KpiCard title="Alerts" value={5} linkTo="/alerts" />);
    const link = screen.getByRole('link', { name: /Alerts: 5/ });
    expect(link).toHaveAttribute('href', '/alerts');
  });

  it('renders as button when onClick is provided', () => {
    const onClick = vi.fn();
    wrap(<KpiCard title="Action" value={1} onClick={onClick} />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('responds to Enter key when onClick is provided', () => {
    const onClick = vi.fn();
    wrap(<KpiCard title="Action" value={1} onClick={onClick} />);
    const btn = screen.getByRole('button');
    fireEvent.keyDown(btn, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('responds to Space key when onClick is provided', () => {
    const onClick = vi.fn();
    wrap(<KpiCard title="Action" value={1} onClick={onClick} />);
    const btn = screen.getByRole('button');
    fireEvent.keyDown(btn, { key: ' ' });
    expect(onClick).toHaveBeenCalledOnce();
  });
});
