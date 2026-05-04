import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable } from '../DataTable';

const columns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'status', header: 'Status' },
];

const data = [
  { id: '1', name: 'Bravo', status: 'ok' },
  { id: '2', name: 'Alpha', status: 'fail' },
  { id: '3', name: 'Charlie', status: 'ok' },
];

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable columns={columns} data={data} keyField="id" />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders row data', () => {
    render(<DataTable columns={columns} data={data} keyField="id" />);
    expect(screen.getByText('Bravo')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('shows empty message when data is empty', () => {
    render(<DataTable columns={columns} data={[]} keyField="id" emptyMessage="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('shows default empty message', () => {
    render(<DataTable columns={columns} data={[]} keyField="id" />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('sorts ascending then descending on header click', () => {
    render(<DataTable columns={columns} data={data} keyField="id" />);
    fireEvent.click(screen.getByText('Name'));
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Alpha');
    expect(rows[2]).toHaveTextContent('Bravo');
    expect(rows[3]).toHaveTextContent('Charlie');

    fireEvent.click(screen.getByText('Name'));
    const rows2 = screen.getAllByRole('row');
    expect(rows2[1]).toHaveTextContent('Charlie');
    expect(rows2[2]).toHaveTextContent('Bravo');
    expect(rows2[3]).toHaveTextContent('Alpha');
  });

  it('calls onRowClick with the row data', () => {
    const onClick = vi.fn();
    render(<DataTable columns={columns} data={data} keyField="id" onRowClick={onClick} />);
    fireEvent.click(screen.getByText('Alpha'));
    expect(onClick).toHaveBeenCalledWith(data[1]);
  });

  it('supports selectable rows with checkboxes', () => {
    const onSelection = vi.fn();
    render(
      <DataTable columns={columns} data={data} keyField="id" selectable onSelectionChange={onSelection} />,
    );
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(4); // 1 select-all + 3 rows

    fireEvent.click(checkboxes[1]);
    expect(onSelection).toHaveBeenCalledWith(['1']);
  });

  it('select-all toggles all rows', () => {
    const onSelection = vi.fn();
    render(
      <DataTable columns={columns} data={data} keyField="id" selectable onSelectionChange={onSelection} />,
    );
    const selectAll = screen.getByLabelText('Select all rows');
    fireEvent.click(selectAll);
    expect(onSelection).toHaveBeenCalledWith(['1', '2', '3']);

    fireEvent.click(selectAll);
    expect(onSelection).toHaveBeenCalledWith([]);
  });

  it('uses custom render function for column', () => {
    const cols = [
      { key: 'name', header: 'Name', render: (row: { name: string }) => <b>{row.name}!</b> },
    ];
    render(<DataTable columns={cols} data={[{ id: '1', name: 'Test' }]} keyField="id" />);
    expect(screen.getByText('Test!')).toBeInTheDocument();
  });
});
