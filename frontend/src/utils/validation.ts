export function validateEmail(email: string): string | null {
  if (!email) return "L'email est requis"
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "L'email n'est pas valide"
  return null
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Au moins 8 caractères'
  if (!/[A-Z]/.test(password)) return 'Au moins une majuscule'
  if (!/[a-z]/.test(password)) return 'Au moins une minuscule'
  if (!/[0-9]/.test(password)) return 'Au moins un chiffre'
  if (!/[^A-Za-z0-9]/.test(password)) return 'Au moins un caractère spécial (!@#$...)'
  return null
}

export function validateConfirm(password: string, confirm: string): string | null {
  if (!confirm) return 'Veuillez confirmer le mot de passe'
  if (password !== confirm) return 'Les mots de passe ne correspondent pas'
  return null
}
