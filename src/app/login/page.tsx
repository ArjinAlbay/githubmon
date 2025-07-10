'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { useAuthStore } from '@/stores'

export default function LoginPage() {
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { setOrgData, setConnected, setTokenExpiry } = useAuthStore()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (!response.ok) {
        throw new Error('Invalid token. Please check your token.')
      }

      const userData = await response.json()

      const expiryDate = new Date()
      expiryDate.setMonth(expiryDate.getMonth() + 1)

      setOrgData({
        orgName: userData.login,
        token: token.trim()
      })
      setTokenExpiry(expiryDate.toISOString())
      setConnected(true)

      router.push('/dashboard')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const continueWithoutToken = () => {
    setOrgData({ orgName: 'guest', token: '' })
    setConnected(true)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left Column - Token Guide */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">GitHubMon</h1>
            <p className="text-muted-foreground">A powerful platform to analyze GitHub organizations</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle> Why is a GitHub Token Needed?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Without token</span>
                <Badge variant="destructive">60 requests/hour</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>With token</span>
                <Badge variant="default">5,000 requests/hour</Badge>
              </div>
              <p className="text-sm text-gray-600">
                Use your GitHub token to fetch more data and avoid hitting the rate limit.
              </p>
            </CardContent>
          </Card>


          <Card>
            <CardHeader>
              <CardTitle>How to Get a Token?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">

              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <span className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-800 rounded-full text-sm font-bold">1</span>
                  <div>
                    <p className="font-medium">Go to GitHub</p>
                    <p className="text-sm text-gray-600">Settings → Developer settings → Personal access tokens</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <span className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-800 rounded-full text-sm font-bold">2</span>
                  <div>
                    <p className="font-medium">Generate a new token</p>
                    <p className="text-sm text-gray-600">Use the "Generate new token (classic)" option</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <span className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-800 rounded-full text-sm font-bold">3</span>
                  <div>
                    <p className="font-medium">Select required permissions</p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>✅ <code className="bg-gray-100 px-1 rounded">repo</code> (for public repos)</div>
                      <div>✅ <code className="bg-gray-100 px-1 rounded">user</code> (for user info)</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <span className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-800 rounded-full text-sm font-bold">4</span>
                  <div>
                    <p className="font-medium">Copy your token</p>
                    <p className="text-sm text-gray-600">Store your token in a safe place - it will only be shown once</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  Create GitHub Token →
                </a>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>🔒 Security</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Your token is only stored in your browser</li>
                <li>• It is not sent to our servers</li>
                <li>• It will be automatically deleted after 1 month</li>
                <li>• You can log out at any time</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Login Form */}
        <div className="flex flex-col justify-center">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Login with GitHub Token</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    GitHub Personal Access Token
                  </label>
                  <Input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    className="font-mono text-sm"
                  />
                  {error && (
                    <p className="text-red-600 text-sm mt-2">{error}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !token.trim()}
                >
                  {isLoading ? 'Verifying...' : 'Login'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={continueWithoutToken}
                  className="w-full mt-4"
                >
                  Continue Without Token
                  <span className="ml-2 text-xs text-gray-500">(Limited)</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 text-center text-sm text-gray-500">
            <p>Already have an account? Enter your token above.</p>
          </div>
        </div>
      </div>
    </div>
  )
}