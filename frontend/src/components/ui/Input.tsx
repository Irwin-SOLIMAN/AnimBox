import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

const Input = ({ label, error, id, className = '', ...props }: InputProps) => {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#f4b942]/60 transition ${
          error ? 'border-red-500/60' : 'border-white/10 hover:border-white/20'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

export default Input
