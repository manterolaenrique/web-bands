'use client'

import {useEffect, useRef, useState, type CSSProperties, type ReactNode} from 'react'

export function Reveal({
  children,
  className,
  delay = 0,
  threshold = 0.18,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  delay?: number
  threshold?: number
  as?: 'div' | 'section' | 'article'
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const node = ref.current
    if (!node) {
      return
    }

    if (isVisible) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      {
        threshold,
        rootMargin: '0px 0px -56px 0px',
      }
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [isVisible, threshold])

  return (
    <Tag
      ref={ref as never}
      className={`${className || ''} reveal${isVisible ? ' reveal--visible' : ''}`.trim()}
      style={{'--reveal-delay': `${delay}ms`} as CSSProperties}
    >
      {children}
    </Tag>
  )
}
