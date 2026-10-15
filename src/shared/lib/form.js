/** Normalises TanStack Form error arrays (strings or Standard Schema issues) to one message. */
export function fieldError(errors) {
  for (const e of errors) {
    if (!e) continue
    if (typeof e === 'string') return e
    if (typeof e === 'object' && 'message' in e) return String(e.message)
  }
  return undefined
}
