import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input className={`input-field ${className}`} {...props} />
      {error && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</span>}
    </div>
  );
};
