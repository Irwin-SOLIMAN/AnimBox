import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

const Input = ({ label, error, id, className = '', ...props }: InputProps) => {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-brand-darkest">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary ${
          error ? 'border-red-400' : 'border-gray-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  )
}

export default Input
