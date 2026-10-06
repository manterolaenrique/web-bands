'use client'

export function SetlistPrintButton({
  className = 'button button--primary',
  label = 'Imprimir / Guardar PDF',
}: {
  className?: string
  label?: string
}) {
  return (
    <button
      className={className}
      type="button"
      onClick={() => {
        window.print()
      }}
    >
      {label}
    </button>
  )
}
