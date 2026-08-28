'use client'

import { useState, useEffect } from 'react'
import { AuthProvider } from 'lyzr-architect/client'
import ErrorBoundary from '@/components/ErrorBoundary'
import { AgentInterceptorProvider } from '@/components/AgentInterceptorProvider'
import { HydrationGuard } from '@/components/HydrationGuard'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // During SSR/prerendering, render nothing to avoid context errors
  if (!mounted) return null

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AgentInterceptorProvider>
          <HydrationGuard>
            {children}
          </HydrationGuard>
        </AgentInterceptorProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
