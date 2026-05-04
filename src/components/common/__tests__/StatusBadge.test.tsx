import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders the label text', () => {
    render(<StatusBadge label="get_quote" />);
    expect(screen.getByText('get_quote')).toBeInTheDocument();
  });

  it('applies explicit variant class', () => {
    const { container } = render(<StatusBadge label="custom" variant="warning" />);
    expect(container.firstChild).toHaveClass('status-badge--warning');
  });

  it('auto-maps agent state labels', () => {
    const { container: c1 } = render(<StatusBadge label="get_quote" />);
    expect(c1.firstChild).toHaveClass('status-badge--success');

    const { container: c2 } = render(<StatusBadge label="failed" />);
    expect(c2.firstChild).toHaveClass('status-badge--danger');

    const { container: c3 } = render(<StatusBadge label="retry" />);
    expect(c3.firstChild).toHaveClass('status-badge--warning');

    const { container: c4 } = render(<StatusBadge label="terminated" />);
    expect(c4.firstChild).toHaveClass('status-badge--neutral');
  });

  it('auto-maps service status labels', () => {
    const { container: c1 } = render(<StatusBadge label="up" />);
    expect(c1.firstChild).toHaveClass('status-badge--success');

    const { container: c2 } = render(<StatusBadge label="down" />);
    expect(c2.firstChild).toHaveClass('status-badge--danger');
  });

  it('auto-maps certificate expiry categories', () => {
    const { container: c1 } = render(<StatusBadge label="warning_90d" />);
    expect(c1.firstChild).toHaveClass('status-badge--info');

    const { container: c2 } = render(<StatusBadge label="warning_30d" />);
    expect(c2.firstChild).toHaveClass('status-badge--warning');

    const { container: c3 } = render(<StatusBadge label="critical_7d" />);
    expect(c3.firstChild).toHaveClass('status-badge--danger');

    const { container: c4 } = render(<StatusBadge label="critical_1d" />);
    expect(c4.firstChild).toHaveClass('status-badge--danger');
  });

  it('falls back to neutral for unknown labels', () => {
    const { container } = render(<StatusBadge label="something_unknown" />);
    expect(container.firstChild).toHaveClass('status-badge--neutral');
  });

  it('is case-insensitive for auto-mapping', () => {
    const { container } = render(<StatusBadge label="VALID" />);
    expect(container.firstChild).toHaveClass('status-badge--success');
  });

  it('uses "--" for null-ish label', () => {
    render(<StatusBadge label={null as unknown as string} />);
    expect(screen.getByText('--')).toBeInTheDocument();
  });
});
