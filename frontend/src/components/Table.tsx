interface Column {
  key: string;
  header: string;
  render?: (value: any, row: any) => React.ReactNode;
  mono?: boolean;
}

interface TableProps {
  columns: Column[];
  data: any[];
  className?: string;
}

export function Table({ columns, data, className = '' }: TableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[var(--section-bg)] border-b border-[var(--border-color)]">
            {columns.map(col => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-sm font-medium text-[var(--text-primary)]"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-[var(--text-muted)]">
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-[var(--border-color)] hover:bg-[var(--light-blue-tint)] transition-colors"
                style={{ height: '52px' }}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-sm ${col.mono ? 'font-mono' : ''}`}
                    style={col.mono ? { fontFamily: 'var(--font-mono)', fontSize: 'var(--text-mono)' } : {}}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
