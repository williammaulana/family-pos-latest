"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface StoreSettings {
  logo: string | null
  storeName: string
  storeSubtitle: string
  primaryColor: string
  secondaryColor: string
}

interface SettingsContextType {
  settings: StoreSettings
  updateSettings: (newSettings: Partial<StoreSettings>) => void
}

const defaultSettings: StoreSettings = {
  logo: null,
  storeName: "Family Store",
  storeSubtitle: "POS & Inventory",
  primaryColor: "#1e40af",
  secondaryColor: "#1e3a8a",
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings)

  useEffect(() => {
    // Load settings from localStorage on mount
    const savedSettings = localStorage.getItem("storeSettings")
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      setSettings({ ...defaultSettings, ...parsed })

      // Apply theme colors
      document.documentElement.style.setProperty("--primary-color", parsed.primaryColor || defaultSettings.primaryColor)
      document.documentElement.style.setProperty(
        "--secondary-color",
        parsed.secondaryColor || defaultSettings.secondaryColor,
      )
    }
  }, [])

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    localStorage.setItem("storeSettings", JSON.stringify(updatedSettings))

    // Apply theme colors if they changed
    if (newSettings.primaryColor) {
      document.documentElement.style.setProperty("--primary-color", newSettings.primaryColor)
    }
    if (newSettings.secondaryColor) {
      document.documentElement.style.setProperty("--secondary-color", newSettings.secondaryColor)
    }
  }

  return <SettingsContext.Provider value={{ settings, updateSettings }}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
