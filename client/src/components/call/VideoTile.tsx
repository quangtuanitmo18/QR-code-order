'use client'

import { useEffect, useRef } from 'react'

interface VideoTileProps {
  stream: MediaStream | null
  isLocal?: boolean
  className?: string
}

export function VideoTile({ stream, isLocal = false, className = '' }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className={`relative overflow-hidden rounded-xl bg-black ${className}`}>
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Always mute local video to prevent echo
          className={`h-full w-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`} // Mirror local video
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
          No Video
        </div>
      )}
    </div>
  )
}
