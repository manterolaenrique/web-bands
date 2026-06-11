'use client'

import {useState} from 'react'

function legacyCopyToClipboard(value: string) {
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  textarea.style.inset = '-9999px'

  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, value.length)

  try {
    return document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
}

export function InviteLinkActions({
  invitePath,
}: {
  invitePath: string
}) {
  const [feedback, setFeedback] = useState<string | null>(null)

  async function handleCopyLink() {
    const inviteUrl = new URL(invitePath, window.location.origin).toString()

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteUrl)
      } else if (!legacyCopyToClipboard(inviteUrl)) {
        throw new Error('legacy-copy-failed')
      } else {
        setFeedback('Enlace copiado.')
        return
      }

      setFeedback('Enlace copiado.')
    } catch {
      if (legacyCopyToClipboard(inviteUrl)) {
        setFeedback('Enlace copiado.')
        return
      }

      setFeedback('No pudimos copiar el enlace en este dispositivo.')
    }
  }

  return (
    <div className="member-card__manual-link">
      <button className="button" type="button" onClick={() => void handleCopyLink()}>
        Copiar enlace
      </button>
      {feedback ? <p className="muted member-card__manual-link-note">{feedback}</p> : null}
    </div>
  )
}
