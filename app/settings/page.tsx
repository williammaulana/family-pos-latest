"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Upload, Palette, Store, Save, RotateCcw, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSettings } from "@/lib/settings-context"

const colorPresets = [
  { name: "Blue (Default)", primary: "#1e40af", secondary: "#1e3a8a" },
  { name: "Green", primary: "#059669", secondary: "#047857" },
  { name: "Purple", primary: "#7c3aed", secondary: "#6d28d9" },
  { name: "Red", primary: "#dc2626", secondary: "#b91c1c" },
  { name: "Orange", primary: "#ea580c", secondary: "#c2410c" },
  { name: "Teal", primary: "#0d9488", secondary: "#0f766e" },
]

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const [logo, setLogo] = useState<string | null>(settings.logo)
  const [storeName, setStoreName] = useState(settings.storeName)
  const [storeSubtitle, setStoreSubtitle] = useState(settings.storeSubtitle)
  const [selectedColor, setSelectedColor] = useState(() => {
    const preset = colorPresets.find((p) => p.primary === settings.primaryColor)
    return preset || { name: "Custom", primary: settings.primaryColor, secondary: settings.secondaryColor }
  })
  const [customPrimary, setCustomPrimary] = useState(settings.primaryColor)
  const [customSecondary, setCustomSecondary] = useState(settings.secondaryColor)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    setLogo(settings.logo)
    setStoreName(settings.storeName)
    setStoreSubtitle(settings.storeSubtitle)
    setCustomPrimary(settings.primaryColor)
    setCustomSecondary(settings.secondaryColor)

    const preset = colorPresets.find((p) => p.primary === settings.primaryColor)
    setSelectedColor(preset || { name: "Custom", primary: settings.primaryColor, secondary: settings.secondaryColor })
  }, [settings])

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 2MB",
          variant: "destructive",
        })
        return
      }

      setIsUploading(true)
      try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload-logo", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Upload failed")
        }

        const { url } = await response.json()
        setLogo(url)

        toast({
          title: "Logo uploaded",
          description: "Your logo has been uploaded successfully",
        })
      } catch (error) {
        console.error("Logo upload error:", error)
        toast({
          title: "Upload failed",
          description: "Failed to upload logo. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleSaveSettings = () => {
    const newSettings = {
      logo,
      storeName,
      storeSubtitle,
      primaryColor: selectedColor.name === "Custom" ? customPrimary : selectedColor.primary,
      secondaryColor: selectedColor.name === "Custom" ? customSecondary : selectedColor.secondary,
    }

    updateSettings(newSettings)

    toast({
      title: "Settings saved",
      description: "Your store customization has been applied successfully",
    })
  }

  const handleResetSettings = () => {
    const defaultSettings = {
      logo: null,
      storeName: "Family Store",
      storeSubtitle: "POS & Inventory",
      primaryColor: "#1e40af",
      secondaryColor: "#1e3a8a",
    }

    updateSettings(defaultSettings)
    setSelectedColor(colorPresets[0])
    setCustomPrimary("#1e40af")
    setCustomSecondary("#1e3a8a")

    toast({
      title: "Settings reset",
      description: "All customizations have been reset to default",
    })
  }

  return (
    <DashboardLayout title="Store Settings">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 md:mb-6">
          <p className="text-muted-foreground text-sm md:text-base">Customize your store's appearance and branding</p>
        </div>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          {/* Logo & Branding */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Store className="h-4 w-4 md:h-5 md:w-5" />
                Store Branding
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Upload your logo and customize store information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              <div>
                <Label htmlFor="logo" className="text-sm">
                  Store Logo
                </Label>
                <div className="mt-2 flex items-center gap-3 md:gap-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    {logo ? (
                      <img
                        src={logo || "/placeholder.svg"}
                        alt="Store logo"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <Store className="h-4 w-4 md:h-6 md:w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-2 text-xs md:text-sm"
                    >
                      {isUploading ? (
                        <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                      ) : (
                        <Upload className="h-3 w-3 md:h-4 md:w-4" />
                      )}
                      {isUploading ? "Uploading..." : "Upload Logo"}
                    </Button>
                    {logo && !isUploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLogo(null)}
                        className="text-red-600 hover:text-red-700 text-xs md:text-sm"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <p className="text-xs text-muted-foreground mt-1">Recommended: 64x64px, PNG or JPG, max 2MB</p>
              </div>

              <div>
                <Label htmlFor="storeName" className="text-sm">
                  Store Name
                </Label>
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Enter store name"
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="storeSubtitle" className="text-sm">
                  Store Subtitle
                </Label>
                <Input
                  id="storeSubtitle"
                  value={storeSubtitle}
                  onChange={(e) => setStoreSubtitle(e.target.value)}
                  placeholder="Enter store subtitle"
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Color Theme */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Palette className="h-4 w-4 md:h-5 md:w-5" />
                Color Theme
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Choose a color scheme for your store interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              <div>
                <Label className="text-sm">Color Presets</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {colorPresets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant={selectedColor.name === preset.name ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedColor(preset)}
                      className="justify-start gap-2 text-xs md:text-sm"
                    >
                      <div
                        className="w-3 h-3 md:w-4 md:h-4 rounded-full border"
                        style={{ backgroundColor: preset.primary }}
                      />
                      {preset.name}
                    </Button>
                  ))}
                  <Button
                    variant={selectedColor.name === "Custom" ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setSelectedColor({ name: "Custom", primary: customPrimary, secondary: customSecondary })
                    }
                    className="justify-start gap-2 text-xs md:text-sm"
                  >
                    <div
                      className="w-3 h-3 md:w-4 md:h-4 rounded-full border"
                      style={{ backgroundColor: customPrimary }}
                    />
                    Custom
                  </Button>
                </div>
              </div>

              {selectedColor.name === "Custom" && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="primaryColor" className="text-sm">
                      Primary Color
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={customPrimary}
                        onChange={(e) => setCustomPrimary(e.target.value)}
                        className="w-10 h-8 md:w-12 md:h-10 p-1 border rounded"
                      />
                      <Input
                        value={customPrimary}
                        onChange={(e) => setCustomPrimary(e.target.value)}
                        placeholder="#1e40af"
                        className="flex-1 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor" className="text-sm">
                      Secondary Color
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={customSecondary}
                        onChange={(e) => setCustomSecondary(e.target.value)}
                        className="w-10 h-8 md:w-12 md:h-10 p-1 border rounded"
                      />
                      <Input
                        value={customSecondary}
                        onChange={(e) => setCustomSecondary(e.target.value)}
                        placeholder="#1e3a8a"
                        className="flex-1 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Color Preview */}
              <div>
                <Label className="text-sm">Preview</Label>
                <div
                  className="mt-2 p-3 md:p-4 rounded-lg border"
                  style={{ backgroundColor: selectedColor.name === "Custom" ? customPrimary : selectedColor.primary }}
                >
                  <div className="text-white font-medium text-sm md:text-base">Primary Color</div>
                  <div
                    className="mt-2 p-2 rounded text-white text-xs md:text-sm"
                    style={{
                      backgroundColor: selectedColor.name === "Custom" ? customSecondary : selectedColor.secondary,
                    }}
                  >
                    Secondary Color
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-4 md:my-6" />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleResetSettings}
            className="flex items-center gap-2 bg-transparent text-sm"
          >
            <RotateCcw className="h-3 w-3 md:h-4 md:w-4" />
            Reset to Default
          </Button>
          <Button onClick={handleSaveSettings} className="flex items-center gap-2 text-sm">
            <Save className="h-3 w-3 md:h-4 md:w-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
