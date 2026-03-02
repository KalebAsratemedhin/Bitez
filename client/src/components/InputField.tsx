import React from 'react';

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  register: any;
  error?: string;
  placeholder?: string;
  compact?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type = 'text',
  register,
  error,
  placeholder,
  compact,
}) => {
  return (
    <div>
      <label htmlFor={name} className={`block font-medium text-stone-700 ${compact ? "text-xs mb-1" : "text-sm mb-1.5"}`}>
        {label}
      </label>
      <input
        type={type}
        id={name}
        {...register(name)}
        placeholder={placeholder}
        className={`w-full border bg-white text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition ${
          compact ? "px-3 py-2 text-sm rounded-lg" : "px-4 py-2.5 rounded-xl"
        } ${error ? "border-[var(--brand)]" : "border-stone-300"}`}
      />
      {error && <p className={`text-[var(--brand)] mt-1 ${compact ? "text-xs" : "text-sm"}`}>{error}</p>}
    </div>
  );
};

export default InputField;
