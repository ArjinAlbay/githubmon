'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores'

interface ExtendedSession {
  accessToken?: string
  user?: {
    login?: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export default function AuthCallback() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { setOrgData, setConnected, setTokenExpiry } = useAuthStore()

  useEffect(() => {
    if (status === 'loading') return
    
    console.log('Auth callback - status:', status)
    console.log('Auth callback - session:', session)

    if (status === 'unauthenticated') {
      console.log('Not authenticated, redirecting to login')
      router.replace('/login?error=authentication_failed')
      return
    }

    if (!session) {
    console.log('No session found, waiting...')
    return
  }
    
    if (status === 'authenticated' && session) {
      const extendedSession = session as ExtendedSession
      
      if (extendedSession?.accessToken && extendedSession.user) {
        console.log('Setting up authenticated user...')
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 30)
        
        const githubUsername = extendedSession.user.login || 'Unknown'
        const displayName = extendedSession.user.name || extendedSession.user.login || 'Unknown'
        
        setOrgData({
          orgName: displayName,
          username: githubUsername,
          token: extendedSession.accessToken
        })
        setTokenExpiry(expiryDate.toISOString())
        setConnected(true)
        
        const cookieValue = JSON.stringify({
          isConnected: true,
          orgData: {
            orgName: displayName,
            username: githubUsername,
            token: extendedSession.accessToken
          },
          tokenExpiry: expiryDate.toISOString()
        })
        
        document.cookie = `githubmon-auth=${encodeURIComponent(cookieValue)}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`
        
        setTimeout(() => {
          router.replace('/dashboard')
        }, 500)
      } else {
        console.error('Authenticated but missing access token')
        router.replace('/login?error=missing_token')
      }
    }
  }, [session, status, router, setOrgData, setConnected, setTokenExpiry])

  return (
    <div className="h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-current/30 border-t-current rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">
          {status === 'loading' ? 'Authenticating with GitHub...' : 'Completing authentication...'}
        </p>
      </div>
    </div>
  )
}