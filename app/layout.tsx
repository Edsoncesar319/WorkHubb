import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import NavbarWrapper from "@/components/navbar-wrapper"
import AnimatedFaviconWrapper from "@/components/animated-favicon-wrapper"
import { Footer } from "@/components/footer"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "WorkHubb - Conectando Talentos Tech",
  description: "A plataforma que conecta talentos tech com as melhores oportunidades do mercado",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="antialiased">
        <AnimatedFaviconWrapper />
        <NavbarWrapper />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
