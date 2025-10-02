"use client"

import { cn } from "@/lib/utils"

import type React from "react"

import { useAuth } from "@/lib/auth"
import { Sidebar } from "@/components/sidebar"
import { Bell, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/supabase-service"
import { useMobile } from "@/hooks/use-mobile"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user } = useAuth()
  const isMobile = useMobile()

  return (
    <div className="flex h-screen bg-gray-50">
      {!isMobile && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-3 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className={cn("", isMobile && "ml-10 md:ml-12")}>
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                {title || `Selamat Datang, ${user?.name}!`}
              </h1>
              <p className="text-xs md:text-sm text-gray-600">{formatDate(new Date())}</p>
            </div>
            <div className="flex items-center gap-1 md:gap-2 lg:gap-4">
              <Button variant="ghost" size="icon" className="relative h-8 w-8 md:h-10 md:w-10">
                <Bell className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5" />
                <span className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 bg-red-500 text-white text-[8px] md:text-[10px] lg:text-xs rounded-full h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 flex items-center justify-center">
                  3
                </span>
              </Button>
              <div className="flex items-center gap-1 md:gap-2 lg:gap-3">
                <div className="bg-blue-600 p-1 md:p-1.5 lg:p-2 rounded-full">
                  <User className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-white" />
                </div>
                <div className="text-right hidden sm:block">
                  <p className="font-medium text-xs md:text-sm truncate max-w-20 md:max-w-none">{user?.name}</p>
                  <p className="text-[10px] md:text-xs text-gray-600 capitalize">{user?.role.replace("_", " ")}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-3 md:p-4 lg:p-6">{children}</main>
        {isMobile && <Sidebar />}
      </div>
    </div>
  )
}
