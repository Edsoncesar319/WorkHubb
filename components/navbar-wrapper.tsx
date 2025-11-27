"use client"

import dynamic from "next/dynamic"

// Importar Navbar dinamicamente sem SSR para evitar problemas com useRouter
const Navbar = dynamic(() => import("@/components/navbar").then(mod => ({ default: mod.Navbar })), {
  ssr: false,
  loading: () => (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              <span className="text-primary glow-effect-strong">Work</span>
              <span className="text-foreground">Hubb</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    </nav>
  )
})

export default function NavbarWrapper() {
  return <Navbar />
}

