'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { useSettings } from '@/lib/settings-context'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  Users,
  Store,
  LogOut,
  ClipboardList,
  Menu,
  Settings,
  ArrowRightLeft,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useMobile } from '@/hooks/use-mobile'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'admin', 'kasir'],
  },
  {
    name: 'Point of Sale',
    href: '/pos',
    icon: ShoppingCart,
    roles: ['super_admin', 'admin', 'kasir'],
  },
  {
    name: 'History Orders',
    href: '/orders',
    icon: ClipboardList,
    roles: ['super_admin', 'admin', 'kasir'],
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: Package,
    roles: ['super_admin', 'admin'],
  },
  {
    name: 'Stock Adjustment',
    href: '/inventory/stock-adjustment',
    icon: ArrowRightLeft,
    roles: ['super_admin', 'admin'],
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
    roles: ['super_admin', 'admin'],
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
    roles: ['super_admin'],
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['super_admin'],
  },
]

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const { user, logout } = useAuth()
  const { settings } = useSettings()
  const pathname = usePathname()

  const filteredNavigation = navigation.filter((item) => user && item.roles.includes(user.role))

  return (
    <div
      className='flex h-full w-full flex-col text-white'
      style={{
        backgroundColor: `var(--primary-color, ${settings.primaryColor})`,
      }}>
      {/* Header */}
      <div
        className='flex items-center gap-3 p-6 border-b'
        style={{
          borderColor: `var(--secondary-color, ${settings.secondaryColor})`,
        }}>
        <div className='bg-white p-2 rounded-lg'>
          {settings.logo ? (
            <img src={settings.logo || '/placeholder.svg'} alt='Store logo' className='h-6 w-6 object-contain' />
          ) : (
            <Store className='h-6 w-6' style={{ color: `var(--primary-color, ${settings.primaryColor})` }} />
          )}
        </div>
        <div>
          <h1 className='font-bold text-lg'>{settings.storeName}</h1>
          <p className='text-blue-200 text-sm'>{settings.storeSubtitle}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className='flex-1 p-4'>
        <ul className='space-y-2'>
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link href={item.href} onClick={onItemClick}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3 text-left',
                      isActive ? 'text-white hover:opacity-90' : 'text-blue-100 hover:text-white hover:opacity-80',
                    )}
                    style={
                      isActive
                        ? {
                            backgroundColor: `var(--secondary-color, ${settings.secondaryColor})`,
                          }
                        : {}
                    }>
                    <item.icon className='h-5 w-5' />
                    {item.name}
                  </Button>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Info & Logout */}
      <div
        className='p-4 border-t'
        style={{
          borderColor: `var(--secondary-color, ${settings.secondaryColor})`,
        }}>
        <div className='mb-3'>
          <p className='font-medium text-sm'>{user?.name}</p>
          <p className='text-blue-200 text-xs capitalize'>{user?.role.replace('_', ' ')}</p>
        </div>
        <Button
          variant='ghost'
          onClick={logout}
          className='w-full justify-start gap-3 text-blue-100 hover:text-white hover:opacity-80'>
          <LogOut className='h-4 w-4' />
          Keluar
        </Button>
      </div>
    </div>
  )
}

export function Sidebar() {
  const isMobile = useMobile()
  const [open, setOpen] = useState(false)

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 md:hidden bg-white shadow-md"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent onItemClick={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="w-64">
      <SidebarContent />
    </div>
  )
}