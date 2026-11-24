import { describe, it, expect } from 'vitest';
import { humanizeLabel } from '../humanize';

describe('humanizeLabel', () => {
  it('keeps domain acronyms uppercase', () => {
    expect(humanizeLabel('pcr_change')).toBe('PCR Change');
    expect(humanizeLabel('ima_violation')).toBe('IMA Violation');
    expect(humanizeLabel('mb_policy')).toBe('MB Policy');
  });

  it('title-cases plain snake_case keys', () => {
    expect(humanizeLabel('attestation_failure')).toBe('Attestation Failure');
    expect(humanizeLabel('service_down')).toBe('Service Down');
    expect(humanizeLabel('clock_skew')).toBe('Clock Skew');
  });

  it('handles single words', () => {
    expect(humanizeLabel('critical')).toBe('Critical');
    expect(humanizeLabel('new')).toBe('New');
  });

  it('preserves hyphenated word casing', () => {
    expect(humanizeLabel('production-v1')).toBe('Production-V1');
  });

  it('returns an empty string for nullish or empty input', () => {
    expect(humanizeLabel(null)).toBe('');
    expect(humanizeLabel(undefined)).toBe('');
    expect(humanizeLabel('')).toBe('');
  });
});
