import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateOrString: Date | string): string {
  const date = dateOrString instanceof Date ? dateOrString : new Date(dateOrString)
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatTime(dateOrString: Date | string): string {
  const date = dateOrString instanceof Date ? dateOrString : new Date(dateOrString)
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

/**
 * Safely derive a human-readable, non-empty error message from any thrown value.
 * Falls back to the provided default when the source message is empty or missing.
 */
export function getErrorMessage(error: unknown, fallback: string = "Internal server error"): string {
  if (error === null || error === undefined) return fallback

  // String errors
  if (typeof error === "string") {
    const trimmed = error.trim()
    return trimmed || fallback
  }

  // Native Error instances
  if (error instanceof Error) {
    const directMessage = (error.message || "").trim()
    if (directMessage) return directMessage

    // Some libraries populate additional fields
    const sqlMessage = (error as any).sqlMessage
    if (typeof sqlMessage === "string" && sqlMessage.trim()) return sqlMessage.trim()

    const details = (error as any).details ?? (error as any).detail
    if (typeof details === "string" && details.trim()) return details.trim()

    // Attempt to read from cause chain
    const cause = (error as any).cause
    if (cause) {
      const causeMessage = getErrorMessage(cause, "")
      if (causeMessage) return causeMessage
    }

    const name = (error.name || "").trim()
    if (name && name.toLowerCase() !== "error") return name

    return fallback
  }

  // Plain objects (e.g., API error objects)
  if (typeof error === "object") {
    const err = error as Record<string, unknown>
    const candidates: unknown[] = [
      err.message,
      (err as any).error_description,
      (err as any).error,
      (err as any).reason,
    ]
    for (const candidate of candidates) {
      if (typeof candidate === "string") {
        const trimmed = candidate.trim()
        if (trimmed) return trimmed
      }
    }

    // Nested error shapes: { error: { message: "..." } }
    const nestedError = (err as any).error
    if (nestedError && typeof nestedError === "object") {
      const nested = getErrorMessage(nestedError, "")
      if (nested) return nested
    }

    // Arrays of errors: { errors: [ { message: "..." } ] }
    const errorsArray = (err as any).errors
    if (Array.isArray(errorsArray)) {
      for (const item of errorsArray) {
        const itemMessage = getErrorMessage(item, "")
        if (itemMessage) return itemMessage
      }
    }
  }

  return fallback
}
