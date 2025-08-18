import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
 const { pathname } = request.nextUrl
 
 const authCookie = request.cookies.get('githubmon-auth')?.value

 let isAuthenticated = false

 if (authCookie) {
  try {
    const decodedCookie = decodeURIComponent(authCookie)
    const authData = JSON.parse(decodedCookie)
    
    if (authData.isConnected && 
        authData.orgData?.token && 
        authData.tokenExpiry) {
      
      const isExpired = new Date() >= new Date(authData.tokenExpiry)
      isAuthenticated = !isExpired
    }
  } catch (error) {
    console.error('Cookie parsing error:', error)
    isAuthenticated = false
  }
}

 const protectedRoutes = ['/dashboard', '/settings']
 const protectedApiRoutes = ['/api/action-required']
 const authRoutes = ['/auth/callback', '/api/auth', '/login']
 const publicRoutes = ['/', '/privacy-policy', '/terms-of-service']

 const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
 const isProtectedApiRoute = protectedApiRoutes.some(route => pathname.startsWith(route))
 const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
 const isPublicRoute = publicRoutes.some(route => pathname === route)

 if (pathname === '/api/auth/logout') {
   const response = NextResponse.next()
   response.cookies.set('githubmon-auth', '', {
     expires: new Date(0),
     path: '/'
   })
   return response
 }

 if (isAuthenticated && pathname === '/') {
   return NextResponse.redirect(new URL('/dashboard', request.url))
 }

 if (isAuthenticated && pathname === '/login') {
   return NextResponse.redirect(new URL('/dashboard', request.url))
 }

 if (!isAuthenticated && isProtectedRoute) {
   return NextResponse.redirect(new URL('/login', request.url))
 }

 if (!isAuthenticated && isProtectedApiRoute) {
   return NextResponse.json(
     { error: 'Unauthorized', message: 'Authentication required to access this resource' },
     { status: 401 }
   )
 }

 if (isAuthRoute || isPublicRoute) {
   return NextResponse.next()
 }

 return NextResponse.next()
}

export const config = {
 matcher: [
   '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
 ],
}