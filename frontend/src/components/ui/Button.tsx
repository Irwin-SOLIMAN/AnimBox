import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:   'text-[#070B14] font-black uppercase tracking-wide',
  secondary: 'bg-white/5 border border-white/15 text-white hover:bg-white/10',
  ghost:     'bg-transparent text-white/60 hover:text-white hover:bg-white/5',
  danger:    'bg-transparent border border-red-500/40 text-red-400 hover:bg-red-900/20',
}

const Button = ({
  children,
  loading = false,
  variant = 'primary',
  disabled,
  className = '',
  style,
  ...props
}: ButtonProps) => {
  const isPrimary = variant === 'primary'

  return (
    <button
      disabled={disabled || loading}
      className={`rounded-xl py-2.5 px-4 transition active:scale-95 disabled:opacity-40 ${variantClasses[variant]} ${className}`}
      style={isPrimary
        ? { background: 'linear-gradient(180deg,#fdd876 0%,#f4b942 50%,#c4922e 100%)', ...style }
        : style
      }
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
