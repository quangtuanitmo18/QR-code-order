import DropdownAvatar from '@/app/[locale]/manage/dropdown-avatar'
import MobileNavLinks from '@/app/[locale]/manage/mobile-nav-links'
import NavLinks from '@/app/[locale]/manage/nav-links'
import AdminAiChatButton from '@/components/ai-chat/admin-ai-chat-button'
import DarkModeToggle from '@/components/dark-mode-toggle'

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen w-full flex-col sm:flex-row">
      <NavLinks />
      <div className="flex flex-1 flex-col sm:gap-4 sm:py-4">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/40 bg-background/80 px-3 backdrop-blur-xl sm:static sm:h-auto sm:gap-4 sm:border-0 sm:bg-transparent sm:px-6 sm:backdrop-blur-none">
          <MobileNavLinks />
          <div className="relative ml-auto flex-1 md:grow-0">
            <div className="flex justify-end">
              <DarkModeToggle />
            </div>
          </div>
          <DropdownAvatar />
        </header>
        {children}
        <AdminAiChatButton />
      </div>
    </div>
  )
}
