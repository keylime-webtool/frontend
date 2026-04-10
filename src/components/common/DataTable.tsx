import { useState } from 'react';
import './common.css';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  onSelectionChange?: (selectedKeys: string[]) => void;
  emptyMessage?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  onRowClick,
  selectable = false,
  onSelectionChange,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleSelect = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelected(next);
    onSelectionChange?.(Array.from(next));
  };

  const toggleAll = () => {
    if (selected.size === rows.length) {
      setSelected(new Set());
      onSelectionChange?.([]);
    } else {
      const all = rows.map((row) => String(row[keyField]));
      setSelected(new Set(all));
      onSelectionChange?.(all);
    }
  };

  const rows = Array.isArray(data) ? data : [];

  const sorted = sortKey
    ? [...rows].sort((a, b) => {
        const av = String(a[sortKey] ?? '');
        const bv = String(b[sortKey] ?? '');
        const cmp = av.localeCompare(bv);
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : rows;

  return (
    <div className="data-table__wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {selectable && (
              <th className="data-table__th data-table__th--checkbox">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selected.size === rows.length}
                  onChange={toggleAll}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={`data-table__th${col.sortable ? ' data-table__th--sortable' : ''}`}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                {col.header}
                {sortKey === col.key && (
                  <span className="data-table__sort-indicator">
                    {sortDir === 'asc' ? ' \u25B2' : ' \u25BC'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="data-table__empty"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row) => {
              const key = String(row[keyField]);
              return (
                <tr
                  key={key}
                  className={`data-table__row${onRowClick ? ' data-table__row--clickable' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="data-table__td" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(key)}
                        onChange={() => toggleSelect(key)}
                        aria-label={`Select row ${key}`}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="data-table__td">
                      {col.render ? col.render(row) : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
