'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ImageLightboxProps {
  images: string[]
  open: boolean
  onClose: () => void
  initialIndex?: number
}

export default function ImageLightbox({
  images,
  open,
  onClose,
  initialIndex = 0,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, currentIndex])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  if (images.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] border-0 bg-black/95 p-0 md:max-w-4xl">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-5 top-5 z-50 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
        ></Button>

        {/* Navigation buttons - only show if more than 1 image */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 z-50 h-12 w-12 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="absolute right-4 top-1/2 z-50 h-12 w-12 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Main image */}
        <div className="relative flex h-[60vh] items-center justify-center md:h-[70vh]">
          <img
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1} of ${images.length}`}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        {/* Image counter and thumbnails */}
        <div className="border-t border-white/10 bg-black/50 p-4">
          {/* Counter */}
          <div className="mb-3 text-center text-sm text-white/80">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Thumbnail strip - only show if more than 1 image */}
          {images.length > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex-shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                    idx === currentIndex
                      ? 'scale-105 border-white'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="h-16 w-16 object-cover md:h-20 md:w-20"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
