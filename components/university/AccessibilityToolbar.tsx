"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

const WRAPPER_ID = "university-app"

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

type ContrastMode = "normal" | "high" | "negative"

type A11yState = {
  fontScale: number
  contrast: ContrastMode
  underlineLinks: boolean
  readableFont: boolean
  lightBackground: boolean
}

const DEFAULT_STATE: A11yState = {
  fontScale: 1,
  contrast: "normal",
  underlineLinks: false,
  readableFont: false,
  lightBackground: false,
}

const STORAGE_KEY = "university_a11y_settings"

function applyToDom(state: A11yState) {
  const root = document.getElementById(WRAPPER_ID)
  if (!root) return

  root.setAttribute("data-contrast", state.contrast)
  root.toggleAttribute("data-links-underline", state.underlineLinks)
  root.toggleAttribute("data-readable-font", state.readableFont)
  root.toggleAttribute("data-light-bg", state.lightBackground)
  ;(root as HTMLElement).style.fontSize = `${Math.round(state.fontScale * 100)}%`
}

export function AccessibilityToolbar() {
  const [state, setState] = useState<A11yState>(DEFAULT_STATE)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as A11yState
        setState(parsed)
        // Apply immediately on mount
        setTimeout(() => applyToDom(parsed), 0)
      } else {
        setTimeout(() => applyToDom(DEFAULT_STATE), 0)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    applyToDom(state)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore
    }
  }, [state])

  const increaseText = () => setState((s) => ({ ...s, fontScale: clamp(Number((s.fontScale + 0.1).toFixed(2)), 0.8, 1.6) }))
  const decreaseText = () => setState((s) => ({ ...s, fontScale: clamp(Number((s.fontScale - 0.1).toFixed(2)), 0.8, 1.6) }))
  const setHighContrast = () => setState((s) => ({ ...s, contrast: s.contrast === "high" ? "normal" : "high" }))
  const setNegativeContrast = () => setState((s) => ({ ...s, contrast: s.contrast === "negative" ? "normal" : "negative" }))
  const setLightBackground = () => setState((s) => ({ ...s, lightBackground: !s.lightBackground }))
  const toggleUnderline = () => setState((s) => ({ ...s, underlineLinks: !s.underlineLinks }))
  const toggleReadableFont = () => setState((s) => ({ ...s, readableFont: !s.readableFont }))
  const resetAll = () => setState(DEFAULT_STATE)

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm" aria-label="Toolbar aksesibilitas">
      <span className="font-medium text-muted-foreground">Aksesibilitas</span>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={increaseText} aria-label="Perbesar teks">Increase Text</Button>
        <Button size="sm" variant="secondary" onClick={decreaseText} aria-label="Perkecil teks">Decrease Text</Button>
        <Button size="sm" variant={state.contrast === "high" ? "default" : "outline"} onClick={setHighContrast} aria-pressed={state.contrast === "high"} aria-label="Kontras tinggi">High Contrast</Button>
        <Button size="sm" variant={state.contrast === "negative" ? "default" : "outline"} onClick={setNegativeContrast} aria-pressed={state.contrast === "negative"} aria-label="Kontras negatif">Negative Contrast</Button>
        <Button size="sm" variant={state.lightBackground ? "default" : "outline"} onClick={setLightBackground} aria-pressed={state.lightBackground} aria-label="Latar belakang terang">Light Background</Button>
        <Button size="sm" variant={state.underlineLinks ? "default" : "outline"} onClick={toggleUnderline} aria-pressed={state.underlineLinks} aria-label="Garis bawah tautan">Links Underline</Button>
        <Button size="sm" variant={state.readableFont ? "default" : "outline"} onClick={toggleReadableFont} aria-pressed={state.readableFont} aria-label="Font mudah dibaca">Readable Font</Button>
        <Button size="sm" variant="destructive" onClick={resetAll} aria-label="Atur ulang">Reset</Button>
      </div>
    </div>
  )
}
