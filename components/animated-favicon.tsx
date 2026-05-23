"use client"

import { useEffect, useRef } from "react"

const SIZE = 32
const STATIC_FALLBACK = "/favicon-16.png"
const SVG_FALLBACK = "/favicon.svg"

/** Cores WorkHubb */
const COLORS = {
  bg: "#0a0a0a",
  wDark: "#1d4ed8",
  wMid: "#3b82f6",
  wLight: "#67e8f9",
  node: "#38bdf8",
  nodeCore: "#e0f2fe",
  line: "#38bdf8",
}

const NODES = [
  { x: 10, y: 10.5 },
  { x: 16, y: 6.5 },
  { x: 22, y: 10.5 },
] as const

const W_PATH: [number, number][] = [
  [5.5, 23.5],
  [10.2, 11.2],
  [16, 19.2],
  [21.8, 11.2],
  [26.5, 23.5],
]

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function pulse(t: number, offset = 0) {
  return 0.55 + 0.45 * Math.sin(t * Math.PI * 2 + offset)
}

function getPacketPosition(t: number): { x: number; y: number } {
  const seg = t * 3
  const i = Math.floor(seg) % 3
  const local = seg - Math.floor(seg)
  const a = NODES[i]
  const b = NODES[(i + 1) % 3]
  return { x: lerp(a.x, b.x, local), y: lerp(a.y, b.y, local) }
}

function drawFrame(ctx: CanvasRenderingContext2D, time: number) {
  const t = time * 0.001

  ctx.clearRect(0, 0, SIZE, SIZE)

  // Fundo arredondado
  ctx.fillStyle = COLORS.bg
  ctx.beginPath()
  const r = 6
  ctx.moveTo(r, 0)
  ctx.lineTo(SIZE - r, 0)
  ctx.quadraticCurveTo(SIZE, 0, SIZE, r)
  ctx.lineTo(SIZE, SIZE - r)
  ctx.quadraticCurveTo(SIZE, SIZE, SIZE - r, SIZE)
  ctx.lineTo(r, SIZE)
  ctx.quadraticCurveTo(0, SIZE, 0, SIZE - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fill()

  // Linhas da rede
  for (let i = 0; i < 3; i++) {
    const a = NODES[i]
    const b = NODES[(i + 1) % 3]
    const alpha = 0.35 + 0.65 * pulse(t, i * 1.1)
    ctx.strokeStyle = COLORS.line
    ctx.globalAlpha = alpha
    ctx.lineWidth = 1.1
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // W com gradiente
  const grad = ctx.createLinearGradient(16, 24, 16, 10)
  grad.addColorStop(0, COLORS.wDark)
  grad.addColorStop(0.55, COLORS.wMid)
  grad.addColorStop(1, COLORS.wLight)

  const wGlow = 0.85 + 0.15 * pulse(t * 0.7, 0)
  ctx.strokeStyle = grad
  ctx.lineWidth = 2.6 + 0.5 * pulse(t * 0.7, 0.5)
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.globalAlpha = wGlow
  ctx.shadowColor = COLORS.wMid
  ctx.shadowBlur = 2.5 * pulse(t, 0)

  ctx.beginPath()
  ctx.moveTo(W_PATH[0][0], W_PATH[0][1])
  for (let i = 1; i < W_PATH.length; i++) {
    ctx.lineTo(W_PATH[i][0], W_PATH[i][1])
  }
  ctx.stroke()
  ctx.shadowBlur = 0
  ctx.globalAlpha = 1

  // Pacote de dados na rede
  const packetT = (t * 0.45) % 1
  const packet = getPacketPosition(packetT)
  ctx.fillStyle = COLORS.nodeCore
  ctx.globalAlpha = Math.sin(packetT * Math.PI)
  ctx.beginPath()
  ctx.arc(packet.x, packet.y, 1.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  // Nós
  NODES.forEach((node, i) => {
    const scale = 0.88 + 0.22 * pulse(t * 1.2, i * 1.3)
    const radius = 2.1 * scale
    const glow = ctx.createRadialGradient(
      node.x,
      node.y,
      0,
      node.x,
      node.y,
      radius * 1.8
    )
    glow.addColorStop(0, COLORS.nodeCore)
    glow.addColorStop(0.5, COLORS.node)
    glow.addColorStop(1, "rgba(56,189,248,0)")
    ctx.fillStyle = glow
    ctx.globalAlpha = 0.7 + 0.3 * pulse(t * 1.2, i * 1.3)
    ctx.beginPath()
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.globalAlpha = 1
}

function ensureFaviconLink(): HTMLLinkElement {
  const existing = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (existing) {
    existing.setAttribute("data-animated", "true")
    return existing
  }
  const link = document.createElement("link")
  link.rel = "icon"
  link.setAttribute("data-animated", "true")
  document.head.appendChild(link)
  return link
}

export function AnimatedFavicon() {
  const rafRef = useRef<number>(0)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reducedMotion) return

    const canvas = document.createElement("canvas")
    canvas.width = SIZE
    canvas.height = SIZE
    canvasRef.current = canvas
    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) return

    const link = ensureFaviconLink()

    const setStatic = () => {
      link.type = "image/png"
      link.href = STATIC_FALLBACK
    }

    const setSvg = () => {
      link.type = "image/svg+xml"
      link.href = `${SVG_FALLBACK}?v=2`
    }

    let lastFrame = 0
    const FRAME_MS = 72 // ~14 fps — suave e leve na bateria

    const animate = (time: number) => {
      rafRef.current = requestAnimationFrame(animate)

      if (document.visibilityState !== "visible") {
        if (link.href !== STATIC_FALLBACK) setStatic()
        return
      }

      if (time - lastFrame < FRAME_MS) return
      lastFrame = time

      drawFrame(ctx, time)
      link.type = "image/png"
      link.href = canvas.toDataURL("image/png")
    }

    // SVG animado enquanto o canvas inicia (evita flash)
    setSvg()
    rafRef.current = requestAnimationFrame(animate)

    const onVisibility = () => {
      if (document.visibilityState === "hidden") setStatic()
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      cancelAnimationFrame(rafRef.current)
      document.removeEventListener("visibilitychange", onVisibility)
      setStatic()
      link.removeAttribute("data-animated")
    }
  }, [])

  return null
}
