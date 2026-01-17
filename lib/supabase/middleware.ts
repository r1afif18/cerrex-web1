import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Fallback values for build time
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    // Skip Supabase if env vars not set (build time)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return supabaseResponse
    }

    const supabase = createServerClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: any[]) {
                    cookiesToSet.forEach(({ name, value }: any) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }: any) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Check for passcode gate
    const hasPasscode = request.cookies.get('cerrex_passcode')?.value === 'verified'

    // Protected routes
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')
    const isGatePage = request.nextUrl.pathname === '/gate'
    const isLoginPage = request.nextUrl.pathname === '/login'
    const isAuthCallback = request.nextUrl.pathname === '/auth/callback'
    const isApiRoute = request.nextUrl.pathname.startsWith('/api')
    const isRoot = request.nextUrl.pathname === '/'

    // If no passcode and trying to access protected route, redirect to gate
    if (!hasPasscode && isProtectedRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/gate'
        return NextResponse.redirect(url)
    }

    // If has passcode and on login page, redirect to dashboard
    if (hasPasscode && isLoginPage) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
