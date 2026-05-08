import { describe, it, expect } from 'vitest';
import { formatTimestamp } from '../format';

describe('formatTimestamp', () => {
  const tz = 'UTC';

  it('returns "--" for null', () => {
    expect(formatTimestamp(null, tz)).toBe('--');
  });

  it('returns "--" for undefined', () => {
    expect(formatTimestamp(undefined, tz)).toBe('--');
  });

  it('returns raw string for invalid date', () => {
    expect(formatTimestamp('not-a-date', tz)).toBe('not-a-date');
  });

  it('formats with default date and time format', () => {
    const result = formatTimestamp('2025-06-15T14:30:00Z', tz);
    expect(result).toContain('15');
    expect(result).toContain('06');
    expect(result).toContain('2025');
    expect(result).toContain('14:30');
  });

  it('uses 12h format when timeFormat is 12h', () => {
    const result = formatTimestamp('2025-06-15T14:30:00Z', tz, 'DD-MM-YYYY', '12h');
    expect(result).toMatch(/2:30/);
    expect(result).toMatch(/PM/i);
  });

  it('uses 24h format when timeFormat is 24h', () => {
    const result = formatTimestamp('2025-06-15T14:30:00Z', tz, 'DD-MM-YYYY', '24h');
    expect(result).toContain('14:30');
  });

  it('respects timeFormat when options are provided', () => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    };
    const result24 = formatTimestamp('2025-06-15T14:30:00Z', tz, undefined, '24h', options);
    expect(result24).toContain('14');
    expect(result24).not.toMatch(/PM/i);

    const result12 = formatTimestamp('2025-06-15T14:30:00Z', tz, undefined, '12h', options);
    expect(result12).toMatch(/PM/i);
  });

  it('formats YYYY-MM-DD date format', () => {
    const result = formatTimestamp('2025-06-15T14:30:00Z', tz, 'YYYY-MM-DD', '24h');
    expect(result).toMatch(/2025-06-15/);
  });

  it('formats MM/DD/YYYY date format', () => {
    const result = formatTimestamp('2025-06-15T14:30:00Z', tz, 'MM/DD/YYYY', '24h');
    expect(result).toMatch(/06\/15\/2025/);
  });

  it('formats DD/MM/YYYY date format', () => {
    const result = formatTimestamp('2025-06-15T14:30:00Z', tz, 'DD/MM/YYYY', '24h');
    expect(result).toMatch(/15\/06\/2025/);
  });

  it('formats YYYY/MM/DD date format', () => {
    const result = formatTimestamp('2025-06-15T14:30:00Z', tz, 'YYYY/MM/DD', '24h');
    expect(result).toMatch(/2025\/06\/15/);
  });

  it('formats MM-DD-YYYY date format', () => {
    const result = formatTimestamp('2025-06-15T14:30:00Z', tz, 'MM-DD-YYYY', '24h');
    expect(result).toMatch(/06-15-2025/);
  });

  it('accepts Date object', () => {
    const result = formatTimestamp(new Date('2025-06-15T14:30:00Z'), tz);
    expect(result).toContain('14:30');
  });

  it('accepts numeric timestamp', () => {
    const ts = new Date('2025-06-15T14:30:00Z').getTime();
    const result = formatTimestamp(ts, tz);
    expect(result).toContain('14:30');
  });
});
