"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ZoomIn, ZoomOut, RotateCw, Check, X } from "lucide-react"

interface ImageCropperProps {
  image: string
  isOpen: boolean
  onClose: () => void
  onCrop: (croppedImage: string) => void
  aspectRatio?: number
}

export function ImageCropper({ image, isOpen, onClose, onCrop, aspectRatio = 1 }: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [cropSize, setCropSize] = useState(300)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    if (isOpen && image) {
      const img = new Image()
      img.src = image
      img.onload = () => {
        imageRef.current = img
        setImageLoaded(true)
        setImageOffset({ x: 0, y: 0 })
        setScale(1)
        setRotation(0)
      }
    }
  }, [isOpen, image])

  useEffect(() => {
    if (imageLoaded && containerRef.current && canvasRef.current) {
      const container = containerRef.current
      const canvas = canvasRef.current
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
      
      const size = Math.min(container.clientWidth * 0.7, container.clientHeight * 0.7, 400)
      setCropSize(size)
      
      draw()
    }
  }, [imageLoaded, cropSize])

  useEffect(() => {
    if (imageLoaded) {
      draw()
    }
  }, [scale, rotation, imageOffset, imageLoaded])

  const draw = () => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !imageRef.current) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = container.clientWidth
    const height = container.clientHeight
    const cropWidth = cropSize
    const cropHeight = cropSize / aspectRatio
    const cropX = (width - cropWidth) / 2
    const cropY = (height - cropHeight) / 2

    ctx.clearRect(0, 0, width, height)

    // Desenhar overlay escuro
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
    ctx.fillRect(0, 0, width, height)

    // Remover overlay da área de crop
    ctx.globalCompositeOperation = "destination-out"
    ctx.fillRect(cropX, cropY, cropWidth, cropHeight)
    ctx.globalCompositeOperation = "source-over"

    // Desenhar borda do crop
    ctx.strokeStyle = "#fff"
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(cropX, cropY, cropWidth, cropHeight)

    // Desenhar imagem
    const img = imageRef.current
    const displayedWidth = img.width * scale
    const displayedHeight = img.height * scale
    const imageX = width / 2 + imageOffset.x - displayedWidth / 2
    const imageY = height / 2 + imageOffset.y - displayedHeight / 2

    ctx.save()
    ctx.translate(width / 2 + imageOffset.x, height / 2 + imageOffset.y)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.drawImage(
      img,
      -displayedWidth / 2,
      -displayedHeight / 2,
      displayedWidth,
      displayedHeight
    )
    ctx.restore()
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - imageOffset.x,
      y: e.clientY - imageOffset.y
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    setImageOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleCrop = () => {
    if (!imageRef.current || !containerRef.current) return

    const img = imageRef.current
    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight
    const cropWidth = cropSize
    const cropHeight = cropSize / aspectRatio
    const cropX = (width - cropWidth) / 2
    const cropY = (height - cropHeight) / 2

    // Calcular dimensões da imagem exibida
    const displayedWidth = img.width * scale
    const displayedHeight = img.height * scale
    
    // Calcular posição da imagem
    const imageCenterX = width / 2 + imageOffset.x
    const imageCenterY = height / 2 + imageOffset.y
    const imageLeft = imageCenterX - displayedWidth / 2
    const imageTop = imageCenterY - displayedHeight / 2
    
    // Calcular coordenadas do crop na imagem original
    const relativeLeft = (cropX - imageLeft) / displayedWidth
    const relativeTop = (cropY - imageTop) / displayedHeight
    const relativeWidth = cropWidth / displayedWidth
    const relativeHeight = cropHeight / displayedHeight
    
    // Criar canvas para o crop
    const cropCanvas = document.createElement("canvas")
    cropCanvas.width = cropWidth
    cropCanvas.height = cropHeight
    const ctx = cropCanvas.getContext("2d")
    if (!ctx) return
    
    // Aplicar rotação se necessário
    if (rotation !== 0) {
      ctx.save()
      ctx.translate(cropCanvas.width / 2, cropCanvas.height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      
      const sourceX = relativeLeft * img.width
      const sourceY = relativeTop * img.height
      const sourceWidth = relativeWidth * img.width
      const sourceHeight = relativeHeight * img.height
      
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        -cropCanvas.width / 2,
        -cropCanvas.height / 2,
        cropCanvas.width,
        cropCanvas.height
      )
      ctx.restore()
    } else {
      const sourceX = relativeLeft * img.width
      const sourceY = relativeTop * img.height
      const sourceWidth = relativeWidth * img.width
      const sourceHeight = relativeHeight * img.height
      
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        cropCanvas.width,
        cropCanvas.height
      )
    }
    
    const croppedImage = cropCanvas.toDataURL("image/png")
    onCrop(croppedImage)
    onClose()
  }

  const handleReset = () => {
    setScale(1)
    setRotation(0)
    setImageOffset({ x: 0, y: 0 })
  }

  if (!imageLoaded) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Ajustar Foto de Perfil</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-[500px]">
            <p className="text-muted-foreground">Carregando imagem...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Ajustar Foto de Perfil</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div
            ref={containerRef}
            className="relative w-full h-[500px] bg-muted rounded-lg overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={scale >= 3}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
              >
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                Redefinir
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={onClose}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleCrop}>
                <Check className="w-4 h-4 mr-2" />
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
