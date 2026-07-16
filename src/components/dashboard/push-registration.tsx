'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// Capacitor injects its bridge into this page when it's loaded inside the
// native mobile app (mobile/ project, server.url mode). In a regular
// browser window.Capacitor is undefined and this component does nothing.
interface PushPlugin {
  checkPermissions: () => Promise<{ receive: string }>
  requestPermissions: () => Promise<{ receive: string }>
  register: () => Promise<void>
  addListener: (event: string, cb: (data: { value: string }) => void) => Promise<unknown>
}

interface CapacitorBridge {
  isNativePlatform?: () => boolean
  getPlatform?: () => string
  Plugins?: { PushNotifications?: PushPlugin }
}

export function PushRegistration() {
  useEffect(() => {
    const cap = (window as { Capacitor?: CapacitorBridge }).Capacitor
    if (!cap?.isNativePlatform?.()) return

    const push = cap.Plugins?.PushNotifications
    if (!push) return

    let cancelled = false

    const register = async () => {
      try {
        let status = (await push.checkPermissions()).receive
        if (status === 'prompt' || status === 'prompt-with-rationale') {
          status = (await push.requestPermissions()).receive
        }
        if (status !== 'granted' || cancelled) return

        await push.addListener('registration', async ({ value: token }) => {
          if (!token || cancelled) return
          const supabase = createClient()
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (!user) return

          const platform = cap.getPlatform?.() ?? 'web'
          // Fire-and-forget — a failed token save just means no push
          // until the next app open retries this.
          await supabase
            .from('device_tokens')
            .upsert(
              { user_id: user.id, token, platform },
              { onConflict: 'token' }
            )
        })

        await push.register()
      } catch {
        // Push is a progressive enhancement — never break the app over it.
      }
    }

    register()

    return () => {
      cancelled = true
    }
  }, [])

  return null
}
