'use client'

import {useState, type FormEvent} from 'react'

import {InlineButtonSpinner} from '@/components/ui/InlineButtonSpinner'
import {usePendingNavigation} from '@/components/ui/usePendingNavigation'
import {createBandRequest} from '@/lib/dashboard/api'

type CreateBandFormProps = {
  defaultName?: string
}

export function CreateBandForm({defaultName = ''}: CreateBandFormProps) {
  const navigation = usePendingNavigation()
  const [name, setName] = useState(defaultName)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const result = await createBandRequest({name})

    if (!result.ok || !result.body?.band) {
      setError(result.body?.message || 'No se pudo crear la banda.')
      setIsSubmitting(false)
      return
    }

    navigation.push(result.body.editorHref || `/dashboard/bands/${result.body.band.id}`)
  }

  const isPending = isSubmitting || navigation.isPending

  return (
    <form onSubmit={handleSubmit} className="form-grid">
      <label className="form-field form-field--full">
        <span className="form-label">Nombre de la banda</span>
        <input
          className="form-input"
          name="name"
          placeholder="Ej: Mi Banda"
          required
          minLength={2}
          maxLength={120}
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          disabled={isPending}
        />
      </label>
      {error ? <div className="status status--error form-field--full">{error}</div> : null}
      <div className="row-actions row-actions--stack-mobile form-field--full">
        <button className="button button--primary" type="submit" disabled={isPending} aria-busy={isPending}>
          {isPending ? <InlineButtonSpinner label="Creando..." /> : 'Crear banda'}
        </button>
      </div>
    </form>
  )
}
