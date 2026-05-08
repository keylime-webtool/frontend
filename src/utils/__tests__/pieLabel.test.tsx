import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { createPieLabelRenderer } from '../pieLabel';

const COLORS: Record<string, string> = {
  critical: '#ea4335',
  warning: '#f9ab00',
  info: '#1a73e8',
};

const BASE_PROPS = {
  cx: 200,
  cy: 150,
  midAngle: 90,
  outerRadius: 80,
  name: 'critical',
  value: 5,
  index: 0,
};

function renderLabel(props: Parameters<ReturnType<typeof createPieLabelRenderer>>[0], config: Parameters<typeof createPieLabelRenderer>[0]) {
  const labelFn = createPieLabelRenderer(config);
  const element = labelFn(props);
  return render(element, { container: document.createElementNS('http://www.w3.org/2000/svg', 'svg') });
}

describe('createPieLabelRenderer', () => {
  it('returns a function', () => {
    const labelFn = createPieLabelRenderer({ colors: COLORS });
    expect(typeof labelFn).toBe('function');
  });

  it('renders a text element with correct content', () => {
    const { container } = renderLabel(BASE_PROPS, { colors: COLORS });
    const text = container.querySelector('text')!;
    expect(text).toBeTruthy();
    expect(text.textContent).toBe('Critical (5)');
  });

  it('applies color from the colors map', () => {
    const { container } = renderLabel(BASE_PROPS, { colors: COLORS });
    const text = container.querySelector('text')!;
    expect(text.getAttribute('fill')).toBe('#ea4335');
  });

  it('uses fallback color for unknown names', () => {
    const props = { ...BASE_PROPS, name: 'unknown_category' };
    const { container } = renderLabel(props, { colors: COLORS });
    const text = container.querySelector('text')!;
    expect(text.getAttribute('fill')).toBe('#bdbdbd');
  });

  it('uses custom fallback color when provided', () => {
    const props = { ...BASE_PROPS, name: 'unknown_category' };
    const { container } = renderLabel(props, { colors: COLORS, fallbackColor: '#999' });
    const text = container.querySelector('text')!;
    expect(text.getAttribute('fill')).toBe('#999');
  });

  it('applies custom fontSize', () => {
    const { container } = renderLabel(BASE_PROPS, { colors: COLORS, fontSize: 11 });
    const text = container.querySelector('text')!;
    expect(text.getAttribute('font-size')).toBe('11');
  });

  it('uses default fontSize of 12', () => {
    const { container } = renderLabel(BASE_PROPS, { colors: COLORS });
    const text = container.querySelector('text')!;
    expect(text.getAttribute('font-size')).toBe('12');
  });

  it('positions label using trigonometric calculation', () => {
    const { container } = renderLabel(BASE_PROPS, { colors: COLORS, offset: 18 });
    const text = container.querySelector('text')!;
    const RADIAN = Math.PI / 180;
    const radius = 80 + 18;
    const expectedX = 200 + radius * Math.cos(-90 * RADIAN);
    const expectedY = 150 + radius * Math.sin(-90 * RADIAN);
    expect(Number(text.getAttribute('x'))).toBeCloseTo(expectedX, 5);
    expect(Number(text.getAttribute('y'))).toBeCloseTo(expectedY, 5);
  });

  it('sets textAnchor to "start" when label is right of center', () => {
    const props = { ...BASE_PROPS, midAngle: 0 };
    const { container } = renderLabel(props, { colors: COLORS });
    const text = container.querySelector('text')!;
    expect(text.getAttribute('text-anchor')).toBe('start');
  });

  it('sets textAnchor to "end" when label is left of center', () => {
    const props = { ...BASE_PROPS, midAngle: 180 };
    const { container } = renderLabel(props, { colors: COLORS });
    const text = container.querySelector('text')!;
    expect(text.getAttribute('text-anchor')).toBe('end');
  });

  it('applies title case formatting by default', () => {
    const props = { ...BASE_PROPS, name: 'attestation_failure' };
    const { container } = renderLabel(props, { colors: COLORS });
    const text = container.querySelector('text')!;
    expect(text.textContent).toBe('Attestation Failure (5)');
  });

  it('uses custom formatLabel when provided', () => {
    const formatLabel = (name: string, value: number) => `${name}: ${value}`;
    const { container } = renderLabel(BASE_PROPS, { colors: COLORS, formatLabel });
    const text = container.querySelector('text')!;
    expect(text.textContent).toBe('critical: 5');
  });

  it('uses getColor for fill when provided', () => {
    const getColor = (_name: string, _index: number) => '#custom';
    const { container } = renderLabel(BASE_PROPS, { colors: COLORS, getColor });
    const text = container.querySelector('text')!;
    expect(text.getAttribute('fill')).toBe('#custom');
  });

  it('passes name and index to getColor', () => {
    const getColor = vi.fn().mockReturnValue('#abc');
    const props = { ...BASE_PROPS, name: 'warning', index: 2 };
    renderLabel(props, { colors: COLORS, getColor });
    expect(getColor).toHaveBeenCalledWith('warning', 2);
  });

  it('sets cursor pointer style when onClick is provided', () => {
    const onClick = vi.fn();
    const { container } = renderLabel(BASE_PROPS, { colors: COLORS, onClick });
    const text = container.querySelector('text')!;
    expect(text.style.cursor).toBe('pointer');
  });

  it('does not set cursor style when onClick is absent', () => {
    const { container } = renderLabel(BASE_PROPS, { colors: COLORS });
    const text = container.querySelector('text')!;
    expect(text.style.cursor).toBe('');
  });

  it('calls onClick with name, index, and event on click', () => {
    const onClick = vi.fn();
    const props = { ...BASE_PROPS, name: 'info', index: 3 };
    const { container } = renderLabel(props, { colors: COLORS, onClick });
    const text = container.querySelector('text')!;
    fireEvent.click(text);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith('info', 3, expect.any(Object));
  });

  it('does not attach onClick handler when onClick is absent', () => {
    const { container } = renderLabel(BASE_PROPS, { colors: COLORS });
    const text = container.querySelector('text')!;
    expect(text.onclick).toBeNull();
  });

  it('handles default props gracefully', () => {
    const { container } = renderLabel({}, { colors: COLORS });
    const text = container.querySelector('text')!;
    expect(text.textContent).toBe(' (0)');
    expect(text.getAttribute('fill')).toBe('#bdbdbd');
  });
});
