/**
 * Domain acronyms that must stay fully uppercase when a snake_case API key
 * is turned into a display label.
 */
const ACRONYMS = new Set(['PCR', 'IMA', 'MB', 'KPI', 'TLS', 'SSH', 'SIEM']);

/**
 * Convert a snake_case API key into a display label, keeping known domain
 * acronyms uppercase (e.g. 'pcr_change' -> 'PCR Change', 'service_down' ->
 * 'Service Down').
 */
export function humanizeLabel(key?: string | null): string {
  if (!key) return '';
  return key
    .split('_')
    .map((word) => {
      const acronym = word.toUpperCase();
      return ACRONYMS.has(acronym) ? acronym : capitalizeWord(word);
    })
    .join(' ');
}

function capitalizeWord(word: string): string {
  // Capitalize the first letter and any letter following a hyphen, so
  // 'production-v1' renders as 'Production-V1'.
  return word.replace(/(^|-)\w/g, (match) => match.toUpperCase());
}
