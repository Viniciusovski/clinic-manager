'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error during auth callback:', error)
        router.push('/') // Redirect to home page on error
      } else if (data?.session) {
        router.push('/dashboard') // Redirect to dashboard on successful auth
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Autenticando...</p>
    </div>
  )
}

