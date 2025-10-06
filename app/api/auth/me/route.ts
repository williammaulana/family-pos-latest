import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, getSessionCookieName, clearSessionCookie } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(getSessionCookieName())?.value
    if (!cookie) {
      return NextResponse.json({ user: null })
    }

    const payload = verifySessionToken(cookie)
    if (!payload) {
      const res = NextResponse.json({ user: null })
      res.headers.set('Set-Cookie', clearSessionCookie())
      return res
    }

    return NextResponse.json({
      user: {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      },
    })
  } catch (_) {
    return NextResponse.json({ user: null })
  }
}
