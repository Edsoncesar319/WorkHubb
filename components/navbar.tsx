"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getCurrentUser, logout } from "@/lib/auth"
import { getUnreadCount } from "@/lib/chat"
import type { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Briefcase,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  User,
  UserPlus,
} from "lucide-react"
import { cn } from "@/lib/utils"

function NavLink({
  href,
  active,
  onClick,
  children,
  icon,
  badge,
}: {
  href: string
  active: boolean
  onClick?: () => void
  children: React.ReactNode
  icon?: React.ReactNode
  badge?: number
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors",
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      {icon && <span className="shrink-0 opacity-80">{icon}</span>}
      <span className="flex-1">{children}</span>
      {badge !== undefined && badge > 0 && (
        <Badge variant="default" className="h-5 min-w-5 px-1.5 text-[10px]">
          {badge > 99 ? "99+" : badge}
        </Badge>
      )}
    </Link>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const current = getCurrentUser()
    setUser(current)
    if (!current) {
      setUnreadCount(0)
      return
    }
    getUnreadCount(current.id).then(setUnreadCount).catch(() => setUnreadCount(0))
  }, [pathname])

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  const handleLogout = () => {
    setDrawerOpen(false)
    logout()
    setUser(null)
    router.push("/")
  }

  const closeDrawer = () => setDrawerOpen(false)

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path)

  const desktopLinkClass = (path: string) =>
    cn(
      "text-sm font-medium transition-colors hover:text-primary",
      isActive(path) ? "text-primary" : "text-muted-foreground"
    )

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              <span className="text-primary glow-effect-strong">Work</span>
              <span className="text-foreground">Hubb</span>
            </div>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-6">
            {(!user || user.type !== "company") && (
              <Link href="/jobs" className={desktopLinkClass("/jobs")}>
                Vagas
              </Link>
            )}

            {user ? (
              <>
                {user.type === "company" && (
                  <Link href="/dashboard" className={desktopLinkClass("/dashboard")}>
                    Dashboard
                  </Link>
                )}

                <Link
                  href="/messages"
                  className={cn(desktopLinkClass("/messages"), "flex items-center gap-1.5")}
                >
                  Mensagens
                  {unreadCount > 0 && (
                    <Badge variant="default" className="h-5 min-w-5 px-1 text-[10px]">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Badge>
                  )}
                </Link>

                <Link href="/profile" className={desktopLinkClass("/profile")}>
                  Perfil
                </Link>

                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="border-primary/30 hover:bg-primary/10 bg-transparent"
                >
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="glow-effect">
                    Cadastrar
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile — menu lateral */}
          <div className="flex md:hidden items-center gap-2">
            {user && unreadCount > 0 && (
              <Badge variant="default" className="h-5 min-w-5 px-1 text-[10px]">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="border-primary/30"
              aria-label="Abrir menu"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-[min(100vw-3rem,320px)] p-0 flex flex-col">
          <SheetHeader className="border-b border-border px-4 py-5 text-left">
            <SheetTitle className="text-xl font-bold">
              <span className="text-primary">Work</span>
              <span className="text-foreground">Hubb</span>
            </SheetTitle>
            {user && (
              <p className="text-sm text-muted-foreground font-normal truncate pt-1">
                {user.name}
                <span className="block text-xs capitalize">
                  {user.type === "company" ? "Empresa" : "Profissional"}
                </span>
              </p>
            )}
          </SheetHeader>

          <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
            {(!user || user.type !== "company") && (
              <NavLink
                href="/jobs"
                active={isActive("/jobs")}
                onClick={closeDrawer}
                icon={<Briefcase className="h-5 w-5" />}
              >
                Vagas
              </NavLink>
            )}

            {user ? (
              <>
                {user.type === "company" && (
                  <NavLink
                    href="/dashboard"
                    active={isActive("/dashboard")}
                    onClick={closeDrawer}
                    icon={<LayoutDashboard className="h-5 w-5" />}
                  >
                    Dashboard
                  </NavLink>
                )}

                <NavLink
                  href="/messages"
                  active={isActive("/messages")}
                  onClick={closeDrawer}
                  icon={<MessageCircle className="h-5 w-5" />}
                  badge={unreadCount}
                >
                  Mensagens
                </NavLink>

                <NavLink
                  href="/profile"
                  active={isActive("/profile")}
                  onClick={closeDrawer}
                  icon={<User className="h-5 w-5" />}
                >
                  Perfil
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  href="/login"
                  active={isActive("/login")}
                  onClick={closeDrawer}
                  icon={<LogIn className="h-5 w-5" />}
                >
                  Entrar
                </NavLink>
                <NavLink
                  href="/register"
                  active={isActive("/register")}
                  onClick={closeDrawer}
                  icon={<UserPlus className="h-5 w-5" />}
                >
                  Cadastrar
                </NavLink>
              </>
            )}
          </nav>

          {user && (
            <div className="border-t border-border p-4 mt-auto">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 border-primary/30"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                Sair
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </nav>
  )
}
