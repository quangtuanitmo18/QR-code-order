'use client'

import menuItems from '@/app/[locale]/manage/menuItems'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Link, usePathname } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { PanelLeft, Settings, UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

export default function NavLinks() {
  const pathname = usePathname()
  const role = useAppStore((state) => state.role)
  const t = useTranslations('Navigation')
  // Start expanded on desktop so the toggle button and labels are clearly visible.
  const [isExpanded, setIsExpanded] = useState(true)

  if (pathname.includes('/manage/login')) {
    return <></>
  }

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'hidden h-screen flex-col border-r border-border/40 bg-card/50 transition-[width] duration-200 sm:flex',
          isExpanded ? 'w-56' : 'w-14'
        )}
      >
        <nav className="flex flex-col gap-4 px-2 py-4">
          {isExpanded ? (
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/"
                className={cn(
                  'group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary text-lg font-semibold text-primary-foreground shadow-glow md:h-8 md:w-8 md:text-base',
                  'ml-1'
                )}
              >
                <UtensilsCrossed className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span className="sr-only">Big Boy Restaurant</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-8 w-8 rounded-lg p-0 text-muted-foreground hover:text-foreground"
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
                className="h-8 w-8 rounded-lg p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setIsExpanded(true)}
              >
                <PanelLeft className="h-4 w-4 transition-transform" />
                <span className="sr-only">Expand sidebar</span>
              </Button>
            </div>
          )}

          <div className="mt-2 flex flex-col gap-1">
            {menuItems.map((Item, index) => {
              const isActive = pathname === Item.href
              if (!Item.roles.includes(role as any)) return null

              const linkContent = (
                <Link
                  href={Item.href}
                  className={cn(
                    'group relative flex items-center rounded-xl px-2.5 py-2.5 text-sm transition-all',
                    {
                      'bg-primary/10 font-medium text-primary': isActive,
                      'text-muted-foreground hover:bg-accent hover:text-foreground': !isActive,
                      'justify-center': !isExpanded,
                      'gap-3': isExpanded,
                    }
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                  )}
                  <Item.Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary')} />
                  {isExpanded && <span className="truncate">{t(Item.title as any)}</span>}
                  <span className="sr-only">{t(Item.title as any)}</span>
                </Link>
              )

              return isExpanded ? (
                <div key={Item.href}>{linkContent}</div>
              ) : (
                <Tooltip key={Item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{t(Item.title as any)}</TooltipContent>
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
                  'group relative flex items-center rounded-xl px-2.5 py-2.5 text-sm transition-all',
                  {
                    'bg-primary/10 font-medium text-primary': isActive,
                    'text-muted-foreground hover:bg-accent hover:text-foreground': !isActive,
                    'justify-center': !isExpanded,
                    'gap-3': isExpanded,
                  }
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <Settings className={cn('h-5 w-5', isActive && 'text-primary')} />
                {isExpanded && <span className="truncate">{t('setting')}</span>}
                <span className="sr-only">{t('setting')}</span>
              </Link>
            )

            return isExpanded ? (
              <div>{linkContent}</div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right">{t('setting')}</TooltipContent>
              </Tooltip>
            )
          })()}
        </nav>
      </aside>
    </TooltipProvider>
  )
}
