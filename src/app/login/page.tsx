'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRequireGuest } from '@/hooks/useAuth'

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-6 space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold">GitHubMon</CardTitle>
            <p className="text-muted-foreground text-sm">
              GitHub organization analytics and monitoring
            </p>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">
                  {error === 'authentication_failed' 
                    ? 'Authentication failed. Please try again.' 
                    : error === 'missing_token'
                    ? 'GitHub authentication succeeded but access token was not received. Please try again.'
                    : 'An error occurred during sign in. Please try again.'}
                </p>
              </div>
            )}
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Welcome Back</h3>
              <p className="text-sm text-muted-foreground">
                Sign in with your GitHub account to continue
              </p>
            </div>

            <Button
              onClick={() => signIn('github')}
              className="w-full h-12 font-semibold text-base"
              size="lg"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
              Continue with GitHub
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                By signing in, you agree to our{' '}
                <Link href="/terms-of-service" className="underline hover:text-foreground transition-colors">
                  terms of service
                </Link>{' '}
                and{' '}
                <Link href="/privacy-policy" className="underline hover:text-foreground transition-colors">
                  privacy policy
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireGuest()

  // If authenticated, redirect will be handled by middleware
  if (!authLoading && isAuthenticated) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-current/30 border-t-current rounded-full animate-spin"></div>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-current/30 border-t-current rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <CardHeader className="text-center pb-6 space-y-2">
              <div className="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto w-32"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto w-48"></div>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
              <div className="text-center space-y-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto w-24"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto w-40"></div>
              </div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}