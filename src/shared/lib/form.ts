/** Normalises TanStack Form error arrays (strings or Standard Schema issues) to one message. */
export function fieldError(errors: unknown[]): string | undefined {
  for (const e of errors) {
    if (!e) continue
    if (typeof e === 'string') return e
    if (typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message)
  }
  return undefined
}
