export function extractInviteTokenFromReturnTo(returnTo: string) {
  const match = returnTo.match(/^\/invite\/([^/?#]+)/)
  return match?.[1] || null
}

export function isInviteReturnTo(returnTo: string) {
  return extractInviteTokenFromReturnTo(returnTo) !== null
}
