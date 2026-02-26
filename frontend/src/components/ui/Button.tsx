import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-brand-primary text-white hover:bg-brand-dark',
  secondary: 'bg-brand-light text-brand-darkest hover:bg-brand-primary hover:text-white',
  ghost: 'bg-transparent text-brand-primary hover:bg-brand-light',
}

const Button = ({
  children,
  loading = false,
  variant = 'primary',
  disabled,
  className = '',
  ...props
}: ButtonProps) => {
  return (
    <button
      disabled={disabled || loading}
      className={`rounded-lg py-2 font-semibold transition-colors disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
