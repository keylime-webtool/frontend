import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { KpiCard } from '@/components/common/KpiCard';

function renderCard(props: React.ComponentProps<typeof KpiCard>) {
  return render(
    <MemoryRouter>
      <KpiCard {...props} />
    </MemoryRouter>
  );
}

describe('KpiCard', () => {
  it('renders as a plain div without linkTo or onClick', () => {
    renderCard({ title: 'Agents', value: 42 });
    const el = screen.getByText('42').closest('.kpi-card');
    expect(el?.tagName).toBe('DIV');
    expect(el).not.toHaveClass('kpi-card--interactive');
  });

  it('renders as a link when linkTo is set', () => {
    renderCard({ title: 'Agents', value: 42, linkTo: '/agents' });
    const link = screen.getByRole('link', { name: /Agents: 42/ });
    expect(link).toHaveAttribute('href', '/agents');
    expect(link).toHaveClass('kpi-card--interactive');
  });

  it('navigates to the correct route with query params', () => {
    renderCard({ title: 'Failed', value: 3, linkTo: '/agents?state=FAILED,FAIL' });
    const link = screen.getByRole('link', { name: /Failed: 3/ });
    expect(link).toHaveAttribute('href', '/agents?state=FAILED,FAIL');
  });

  it('calls onClick when clicked without linkTo', () => {
    const handler = vi.fn();
    renderCard({ title: 'Alerts', value: 5, onClick: handler });
    const el = screen.getByRole('button');
    fireEvent.click(el);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('supports keyboard activation for onClick cards', () => {
    const handler = vi.fn();
    renderCard({ title: 'Alerts', value: 5, onClick: handler });
    const el = screen.getByRole('button');
    fireEvent.keyDown(el, { key: 'Enter' });
    fireEvent.keyDown(el, { key: ' ' });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('preserves variant styling on link cards', () => {
    renderCard({ title: 'Rate', value: '99%', variant: 'success', linkTo: '/attestations' });
    const link = screen.getByRole('link');
    expect(link).toHaveClass('kpi-card--success');
  });
});
