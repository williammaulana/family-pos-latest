import crypto from "crypto"

const SESSION_COOKIE_NAME = "pos_session"
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

function getSecret(): string {
  const secret = process.env.AUTH_COOKIE_SECRET || process.env.NEXTAUTH_SECRET || process.env.COOKIE_SECRET
  if (!secret) {
    throw new Error("Missing AUTH_COOKIE_SECRET (or NEXTAUTH_SECRET/COOKIE_SECRET) env for signing cookies")
  }
  return secret
}

function base64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
}

function sign(data: string, secret: string) {
  return base64url(crypto.createHmac("sha256", secret).update(data).digest())
}

export interface SessionPayload {
  sub: string
  name: string
  email: string
  role: "super_admin" | "admin" | "kasir"
  iat: number
  exp: number
}

export function createSessionToken(payload: Omit<SessionPayload, "iat" | "exp">, maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS) {
  const header = { alg: "HS256", typ: "JWT" }
  const now = Math.floor(Date.now() / 1000)
  const fullPayload: SessionPayload = {
    ...payload,
    iat: now,
    exp: now + maxAgeSeconds,
  }
  const secret = getSecret()
  const headerPart = base64url(JSON.stringify(header))
  const payloadPart = base64url(JSON.stringify(fullPayload))
  const signature = sign(`${headerPart}.${payloadPart}`, secret)
  return `${headerPart}.${payloadPart}.${signature}`
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const secret = getSecret()
    const [headerPart, payloadPart, signature] = token.split(".")
    if (!headerPart || !payloadPart || !signature) return null
    const expected = sign(`${headerPart}.${payloadPart}`, secret)
    if (expected !== signature) return null
    const payload = JSON.parse(Buffer.from(payloadPart.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()) as SessionPayload
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function buildSessionCookie(token: string, maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS) {
  const isProd = process.env.NODE_ENV === "production"
  const parts = [
    `${SESSION_COOKIE_NAME}=${token}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAgeSeconds}`,
  ]
  if (isProd) parts.push("Secure")
  return parts.join("; ")
}

export function clearSessionCookie() {
  const isProd = process.env.NODE_ENV === "production"
  const parts = [
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  ]
  if (isProd) parts.push("Secure")
  return parts.join("; ")
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME
}
