'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FolderOpen, Zap, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    href: '/projects',
    label: 'Projects',
    icon: FolderOpen,
  },
  {
    href: '/generate',
    label: 'Generate',
    icon: Zap,
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-white dark:bg-slate-950 dark:border-slate-800 md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-full py-3 px-2 text-xs font-medium transition-colors',
                isActive
                  ? 'text-blue-600 dark:text-blue-400 border-t-2 border-blue-600 dark:border-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

/**
 * Spacer to add padding below content for bottom navigation
 * Use this at the end of pages to prevent content from being hidden
 */
export function BottomNavSpacer() {
  return <div className="h-20 md:h-0" />
}
