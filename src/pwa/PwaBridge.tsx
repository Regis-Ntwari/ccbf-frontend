import { useEffect } from 'react'
import { usePwaStore } from '@/shared/stores'
import type { BeforeInstallPromptEvent } from '@/shared/stores'

/** Wires browser PWA events (online/offline, install prompt) into the store. */
export function PwaBridge() {
  const setOnline = usePwaStore((s) => s.setOnline)
  const setInstallEvent = usePwaStore((s) => s.setInstallEvent)
  const setInstalled = usePwaStore((s) => s.setInstalled)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    const bip = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    const installed = () => {
      setInstalled(true)
      setInstallEvent(null)
    }
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    window.addEventListener('beforeinstallprompt', bip)
    window.addEventListener('appinstalled', installed)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
      window.removeEventListener('beforeinstallprompt', bip)
      window.removeEventListener('appinstalled', installed)
    }
  }, [setOnline, setInstallEvent, setInstalled])
  return null
}
