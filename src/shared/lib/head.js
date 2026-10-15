import i18n from '@/shared/i18n'
import { qk } from '@/shared/api/keys'

const FALLBACK_NAME = 'CostBOQ'

/** Short product name from the loaded public config, or the fallback before it is cached. */
export function appName(queryClient) {
  return queryClient?.getQueryData(qk.config)?.branding?.shortName ?? FALLBACK_NAME
}

/** `Projects · CostBOQ`, or just the product name when no page title is given. */
export function pageTitle(title, queryClient) {
  const name = appName(queryClient)
  return title ? `${title} · ${name}` : name
}

/**
 * Builds a route `head` option. Pass a translation key (`'titles.projects'`)
 * for a static title, or a function of the head context (`{ loaderData,
 * params, match }`) that returns a ready-to-show string, for a dynamic one.
 * Titles are re-evaluated when the language changes because the app
 * invalidates the router after switching locale.
 */
export const pageHead = (title) => (ctx) => {
  const resolved = typeof title === 'function' ? title(ctx) : title ? i18n.t(title) : null
  return { meta: [{ title: pageTitle(resolved, ctx.match?.context?.queryClient) }] }
}
