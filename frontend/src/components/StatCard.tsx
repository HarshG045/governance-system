interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
}

export function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <div className="bg-white border border-[var(--border-color)] rounded-lg p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between mb-2">
        <div className="text-sm font-medium text-[var(--text-muted)]">{title}</div>
        {icon && <div className="text-[var(--primary-blue)]">{icon}</div>}
      </div>
      <div className="text-3xl font-semibold text-[var(--text-primary)] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
        {value}
      </div>
      {description && <div className="text-xs text-[var(--text-hint)]">{description}</div>}
    </div>
  );
}
