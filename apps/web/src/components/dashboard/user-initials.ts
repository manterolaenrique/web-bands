export function getUserInitials(value: string | null | undefined) {
  if (!value) {
    return 'WB'
  }

  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')

  return initials || 'WB'
}
