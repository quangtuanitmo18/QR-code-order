'use client'

import menuItems from '@/app/[locale]/manage/menuItems'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Link, usePathname } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { PanelLeft, Settings, UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'

export default function NavLinks() {
  const pathname = usePathname()
  const role = useAppStore((state) => state.role)
  // Start expanded on desktop so the toggle button and labels are clearly visible.
  const [isExpanded, setIsExpanded] = useState(true)

  if (pathname.includes('/manage/login')) {
    return <></>
  }

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'hidden h-screen flex-col border-r border-border/50 bg-background/95 backdrop-blur-sm transition-[width] duration-200 sm:flex',
          isExpanded ? 'w-56' : 'w-14'
        )}
      >
        <nav className="flex flex-col gap-4 px-2 py-4">
          {isExpanded ? (
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/"
                className={cn(
                  'group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-tr from-primary to-accent text-lg font-semibold text-primary-foreground shadow-md transition-all hover:shadow-lg md:h-8 md:w-8 md:text-base',
                  'ml-1'
                )}
              >
                <UtensilsCrossed className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span className="sr-only">Big Boy Restaurant</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-8 w-8 p-0"
                onClick={() => setIsExpanded(false)}
              >
                <PanelLeft className="h-4 w-4 rotate-180 transition-transform" />
                <span className="sr-only">Collapse sidebar</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0"
                onClick={() => setIsExpanded(true)}
              >
                <PanelLeft className="h-4 w-4 transition-transform" />
                <span className="sr-only">Expand sidebar</span>
              </Button>
            </div>
          )}

          <div className="mt-2 flex flex-col gap-2">
            {menuItems.map((Item, index) => {
              const isActive = pathname === Item.href
              if (!Item.roles.includes(role as any)) return null

              const linkContent = (
                <Link
                  href={Item.href}
                  className={cn(
                    'flex items-center rounded-lg px-2 py-2 text-sm font-medium transition-all hover:text-foreground',
                    {
                      'bg-gradient-to-r from-primary to-accent text-white shadow-md': isActive,
                      'text-muted-foreground hover:bg-muted/50': !isActive,
                      'justify-center': !isExpanded,
                      'gap-3': isExpanded,
                    }
                  )}
                >
                  <Item.Icon className="h-5 w-5" />
                  {isExpanded && <span className="truncate">{Item.title}</span>}
                  <span className="sr-only">{Item.title}</span>
                </Link>
              )

              return isExpanded ? (
                <div key={Item.href}>{linkContent}</div>
              ) : (
                <Tooltip key={Item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{Item.title}</TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </nav>

        <nav className="mt-auto flex flex-col gap-4 px-2 py-4">
          {(() => {
            const isActive = pathname === '/manage/setting'
            const linkContent = (
              <Link
                href="/manage/setting"
                className={cn(
                  'flex items-center rounded-lg px-2 py-2 text-sm font-medium transition-all hover:text-foreground',
                  {
                    'bg-gradient-to-r from-primary to-accent text-white shadow-md': isActive,
                    'text-muted-foreground hover:bg-muted/50': !isActive,
                    'justify-center': !isExpanded,
                    'gap-3': isExpanded,
                  }
                )}
              >
                <Settings className="h-5 w-5" />
                {isExpanded && <span className="truncate">Setting</span>}
                <span className="sr-only">Setting</span>
              </Link>
            )

            return isExpanded ? (
              <div>{linkContent}</div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right">Setting</TooltipContent>
              </Tooltip>
            )
          })()}
        </nav>
      </aside>
    </TooltipProvider>
  )
}
