import {PendingLink} from '@/components/ui/PendingLink'

export function EmptyState({
  title,
  copy,
  ctaLabel,
  ctaHref,
}: {
  title: string
  copy: string
  ctaLabel: string
  ctaHref: string
}) {
  return (
    <section className="demos-empty-state">
      <div className="demos-empty-state__orb" aria-hidden="true" />
      <div className="demos-empty-state__icon" aria-hidden="true">
        <span />
      </div>
      <div className="demos-empty-state__copy">
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      <PendingLink className="button button--primary demos-empty-state__cta" href={ctaHref} pendingLabel="Abriendo...">
        {ctaLabel}
      </PendingLink>
    </section>
  )
}
