type PageSkeletonVariant = 'dashboard' | 'editor' | 'demos' | 'track'

function renderMetricCards(count: number) {
  return Array.from({length: count}, (_, index) => (
    <div className="page-skeleton__metric" key={`metric-${index}`} />
  ))
}

function renderListRows(count: number) {
  return Array.from({length: count}, (_, index) => (
    <div className="page-skeleton__list-row" key={`row-${index}`}>
      <div className="page-skeleton__avatar" />
      <div className="page-skeleton__copy">
        <div className="page-skeleton__line page-skeleton__line--title" />
        <div className="page-skeleton__line page-skeleton__line--body" />
      </div>
      <div className="page-skeleton__actions">
        <div className="page-skeleton__button" />
        <div className="page-skeleton__button page-skeleton__button--ghost" />
      </div>
    </div>
  ))
}

export function PageSkeleton({
  variant,
  title,
  eyebrow = 'Cargando',
}: {
  variant: PageSkeletonVariant
  title: string
  eyebrow?: string
}) {
  if (variant === 'editor') {
    return (
      <div className="page-skeleton" aria-hidden="true">
        <section className="page-skeleton__hero">
          <div className="page-skeleton__eyebrow">{eyebrow}</div>
          <div className="page-skeleton__title">{title}</div>
          <div className="page-skeleton__line page-skeleton__line--body" />
        </section>
        <section className="page-skeleton__panel-grid">
          <div className="page-skeleton__panel page-skeleton__panel--tall" />
          <div className="page-skeleton__panel page-skeleton__panel--tall" />
          <div className="page-skeleton__panel page-skeleton__panel--tall" />
        </section>
      </div>
    )
  }

  if (variant === 'demos') {
    return (
      <div className="page-skeleton" aria-hidden="true">
        <section className="page-skeleton__hero">
          <div className="page-skeleton__eyebrow">{eyebrow}</div>
          <div className="page-skeleton__title">{title}</div>
          <div className="page-skeleton__line page-skeleton__line--body" />
        </section>
        <section className="page-skeleton__toolbar">
          <div className="page-skeleton__input" />
          <div className="page-skeleton__button" />
          <div className="page-skeleton__button page-skeleton__button--ghost" />
        </section>
        <section className="page-skeleton__panel-grid">
          <div className="page-skeleton__panel page-skeleton__panel--medium" />
          <div className="page-skeleton__panel page-skeleton__panel--medium" />
        </section>
        <section className="page-skeleton__list">{renderListRows(4)}</section>
      </div>
    )
  }

  if (variant === 'track') {
    return (
      <div className="page-skeleton" aria-hidden="true">
        <section className="page-skeleton__hero">
          <div className="page-skeleton__eyebrow">{eyebrow}</div>
          <div className="page-skeleton__title">{title}</div>
          <div className="page-skeleton__line page-skeleton__line--body" />
        </section>
        <section className="page-skeleton__player" />
        <section className="page-skeleton__panel-grid">
          <div className="page-skeleton__panel page-skeleton__panel--medium" />
          <div className="page-skeleton__panel page-skeleton__panel--medium" />
        </section>
      </div>
    )
  }

  return (
    <div className="page-skeleton" aria-hidden="true">
      <section className="page-skeleton__hero">
        <div className="page-skeleton__eyebrow">{eyebrow}</div>
        <div className="page-skeleton__title">{title}</div>
        <div className="page-skeleton__line page-skeleton__line--body" />
      </section>
      <section className="page-skeleton__metrics">{renderMetricCards(4)}</section>
      <section className="page-skeleton__dashboard-grid">
        <div className="page-skeleton__list">{renderListRows(3)}</div>
        <div className="page-skeleton__side">
          <div className="page-skeleton__panel page-skeleton__panel--medium" />
          <div className="page-skeleton__panel page-skeleton__panel--medium" />
        </div>
      </section>
    </div>
  )
}
