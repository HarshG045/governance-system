interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: string;
  actions?: React.ReactNode;
}

export function Card({ children, className = '', header, actions }: CardProps) {
  return (
    <div
      className={`bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-[var(--shadow-card)] ${className}`}
      style={{ padding: header ? '0' : 'var(--card-padding)' }}
    >
      {header && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
          <h3 className="m-0">{header}</h3>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div style={{ padding: header ? 'var(--card-padding)' : '0' }}>
        {children}
      </div>
    </div>
  );
}
