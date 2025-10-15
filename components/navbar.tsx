"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getCurrentUser, logout } from "@/lib/auth"
import type { User } from "@/lib/types"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    setUser(getCurrentUser())
  }, [pathname])

  const handleLogout = () => {
    logout()
    setUser(null)
    router.push("/")
  }

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

          <div className="flex items-center gap-6">
            <Link
              href="/jobs"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/jobs" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Vagas
            </Link>

            {user ? (
              <>
                {user.type === "company" && (
                  <Link
                    href="/dashboard"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    Dashboard
                  </Link>
                )}

                <Link
                  href="/profile"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === "/profile" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
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
        </div>
      </div>
    </nav>
  )
}
