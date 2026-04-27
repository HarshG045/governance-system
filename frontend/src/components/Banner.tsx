interface BannerProps {
  type: 'success' | 'error' | 'info';
  message: string;
  className?: string;
}

export function Banner({ type, message, className = '' }: BannerProps) {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <div className={`px-4 py-3 rounded-md border ${styles[type]} ${className}`}>
      <p className="text-sm font-medium m-0">{message}</p>
    </div>
  );
}
