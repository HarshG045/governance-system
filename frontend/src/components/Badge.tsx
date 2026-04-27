interface BadgeProps {
  type: 'status' | 'role';
  value: string;
  className?: string;
}

export function Badge({ type, value, className = '' }: BadgeProps) {
  const getStatusStyles = (status: string) => {
    const normalized = status.toLowerCase().replace(/\s+/g, '-');
    switch (normalized) {
      case 'submitted':
        return 'bg-[var(--status-submitted-bg)] text-[var(--status-submitted)]';
      case 'in-progress':
      case 'in progress':
        return 'bg-[var(--status-in-progress-bg)] text-[var(--status-in-progress)]';
      case 'resolved':
        return 'bg-[var(--status-resolved-bg)] text-[var(--status-resolved)]';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleStyles = (role: string) => {
    const normalized = role.toLowerCase();
    switch (normalized) {
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'officer':
        return 'bg-blue-100 text-blue-700';
      case 'citizen':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const styles = type === 'status' ? getStatusStyles(value) : getRoleStyles(value);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles} ${className}`}>
      {value}
    </span>
  );
}
