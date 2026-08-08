import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

export const Select: React.FC<SelectProps> = ({ label, error, options, className = '', ...props }) => {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select className={`input-field ${className}`} {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</span>}
    </div>
  );
};
