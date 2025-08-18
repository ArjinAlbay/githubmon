'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores'

// Type assertion for extended session
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
 
 const extendedSession = session as ExtendedSession
 
 if (status === 'authenticated' && extendedSession?.accessToken && extendedSession.user) {
   console.log('Setting up authenticated user...')
   const expiryDate = new Date()
   expiryDate.setDate(expiryDate.getDate() + 30)
   
   // GitHub username'i öncelikle login field'ından al
   const githubUsername = extendedSession.user.login || 'Unknown'
   const displayName = extendedSession.user.name || extendedSession.user.login || 'Unknown'
   
   setOrgData({
     orgName: displayName,
     username: githubUsername,
     token: extendedSession.accessToken
   })
   setTokenExpiry(expiryDate.toISOString())
   setConnected(true)
   
   // Wait a moment for state to update, then redirect
   setTimeout(() => {
     router.replace('/dashboard')
   }, 500)
 } else if (status === 'authenticated' && !extendedSession?.accessToken) {
   console.error('Authenticated but missing access token')
   router.replace('/login?error=missing_token')
 } else if (status === 'unauthenticated') {
   console.log('Not authenticated, redirecting to login')
   // If not authenticated, redirect to login with error
   router.replace('/login?error=authentication_failed')
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

