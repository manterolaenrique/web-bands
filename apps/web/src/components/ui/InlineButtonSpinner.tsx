import {LoadingSpinner} from './LoadingSpinner'

export function InlineButtonSpinner({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  return (
    <span className={`inline-button-spinner${className ? ` ${className}` : ''}`}>
      <LoadingSpinner size="sm" label={label} />
      <span>{label}</span>
    </span>
  )
}
