// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { createServerClient } from '@supabase/ssr'

import { defaultLocale, localePrefix, locales } from './i18n'

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix,
})

// Adjust these to match your route groups
const PROTECTED_PREFIXES = ['/teacher', '/student', '/superuser']

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
}

function stripLocale(pathname: string) {
  // builds a regex like /^(\/)(en|id)(?=\/|$)/
  const localeGroup = locales.map((l) => l.replace('-', '\\-')).join('|')
  const re = new RegExp(`^/(${localeGroup})(?=/|$)`)
  return pathname.replace(re, '')
}

function getLocalePrefixFromPath(pathname: string) {
  const localeGroup = locales.map((l) => l.replace('-', '\\-')).join('|')
  const re = new RegExp(`^/(${localeGroup})(?=/|$)`)
  const match = pathname.match(re)
  return match ? `/${match[1]}` : ''
}

export default async function middleware(req: NextRequest) {
  // 1) next-intl first (may rewrite)
  const intlResponse = intlMiddleware(req)

  // 2) response we can set cookies on
  const res = intlResponse ?? NextResponse.next()

  // 3) Supabase middleware client: read cookies from req, write to res
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // 4) Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 5) Basic auth gate for protected areas (locale-aware)
  const pathname = req.nextUrl.pathname
  const noLocalePath = stripLocale(pathname)

  if (isProtectedPath(noLocalePath) && !user) {
    const url = req.nextUrl.clone()
    const localePathPrefix = getLocalePrefixFromPath(pathname)
    url.pathname = `${localePathPrefix}/auth/login`
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url, { headers: res.headers })
  }

  return res
}

export const config = {
  matcher: [
    // Start from next-intl default idea (exclude api/_next/files),
    // and also exclude common static assets explicitly.
    '/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
}
