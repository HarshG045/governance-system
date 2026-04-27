interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const baseStyles = 'h-10 px-4 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[var(--primary-blue)] text-white hover:bg-[var(--navy)]',
    secondary: 'bg-[var(--section-bg)] text-[var(--text-primary)] hover:bg-[var(--border-color)]',
    ghost: 'bg-transparent text-[var(--primary-blue)] hover:bg-[var(--light-blue-tint)]',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
