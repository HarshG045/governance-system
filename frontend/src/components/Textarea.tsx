interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>}
      <textarea
        className={`min-h-24 px-3 py-2 bg-white border border-[var(--border-color)] rounded-md
          focus:outline-none focus:ring-2 focus:ring-[var(--mid-blue)] focus:border-transparent
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          resize-y ${className}`}
        {...props}
      />
    </div>
  );
}
