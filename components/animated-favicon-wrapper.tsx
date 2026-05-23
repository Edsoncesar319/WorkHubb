"use client"

import dynamic from "next/dynamic"

const AnimatedFavicon = dynamic(
  () =>
    import("@/components/animated-favicon").then((m) => ({
      default: m.AnimatedFavicon,
    })),
  { ssr: false }
)

export default function AnimatedFaviconWrapper() {
  return <AnimatedFavicon />
}
