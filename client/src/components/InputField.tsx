import React from "react";
import type { UseFormRegister, FieldValues, Path } from "react-hook-form";

interface InputFieldProps<T extends FieldValues = FieldValues> {
  label: string;
  name: Path<T>;
  type?: string;
  register: UseFormRegister<T>;
  error?: string;
  placeholder?: string;
  compact?: boolean;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  /** Sanitize value before RHF sees it (e.g. digits-only phone). */
  filterValue?: (value: string) => string;
}

const InputField = <T extends FieldValues = FieldValues>({
  label,
  name,
  type = "text",
  register,
  error,
  placeholder,
  compact,
  maxLength,
  inputMode,
  filterValue,
}: InputFieldProps<T>) => {
  const { onChange, onBlur, ref, name: fieldName } = register(name);

  return (
    <div>
      <label
        htmlFor={String(name)}
        className={`block font-medium text-stone-700 ${compact ? "text-xs mb-1" : "text-sm mb-1.5"}`}
      >
        {label}
      </label>
      <input
        type={type}
        id={String(name)}
        name={fieldName}
        ref={ref}
        onBlur={onBlur}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => {
          let value = e.target.value;
          if (filterValue) value = filterValue(value);
          if (maxLength != null) value = value.slice(0, maxLength);
          e.target.value = value;
          onChange(e);
        }}
        className={`w-full border bg-white text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition ${
          compact ? "px-3 py-2 text-sm rounded-lg" : "px-4 py-2.5 rounded-xl"
        } ${error ? "border-[var(--brand)]" : "border-stone-300"}`}
      />
      {error && (
        <p className={`text-[var(--brand)] mt-1 ${compact ? "text-xs" : "text-sm"}`}>{error}</p>
      )}
    </div>
  );
};

export default InputField;
