'use client'

import {useRef, type MouseEventHandler, type TouchEventHandler} from 'react'

export function useTapAction<T extends HTMLElement>(action: () => void) {
  const lastTouchAtRef = useRef(0)

  const onTouchEnd: TouchEventHandler<T> = (event) => {
    lastTouchAtRef.current = Date.now()
    event.preventDefault()
    action()
  }

  const onClick: MouseEventHandler<T> = (event) => {
    if (Date.now() - lastTouchAtRef.current < 800) {
      event.preventDefault()
      return
    }

    action()
  }

  return {
    onClick,
    onTouchEnd,
  }
}
