import DropdownAvatar from '@/app/[locale]/manage/dropdown-avatar'
import MobileNavLinks from '@/app/[locale]/manage/mobile-nav-links'
import NavLinks from '@/app/[locale]/manage/nav-links'
import DarkModeToggle from '@/components/dark-mode-toggle'

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 sm:flex-row">
      <NavLinks />
      <div className="flex flex-1 flex-col sm:gap-4 sm:py-4">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background px-3 sm:static sm:h-auto sm:gap-4 sm:border-0 sm:bg-transparent sm:px-6">
          <MobileNavLinks />
          <div className="relative ml-auto flex-1 md:grow-0">
            <div className="flex justify-end">
              <DarkModeToggle />
            </div>
          </div>
          <DropdownAvatar />
        </header>
        {children}
      </div>
    </div>
  )
}
