import { useEffect, useRef, useState } from 'react'
import { loadYouTubeIframeApi } from '../services/youtubeIframeApi'

export interface YouTubePlayerStateChange {
  player: YT.Player
  state: number
  currentTime: number
}

interface YouTubePlayerProps {
  videoId: string | null | undefined
  onReady?: (player: YT.Player) => void
  onStateChange?: (event: YouTubePlayerStateChange) => void
}

function isYouTubeVideoId(value: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(value)
}

export function extractYouTubeVideoId(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }

  const input = value.trim()

  if (isYouTubeVideoId(input)) {
    return input
  }

  try {
    const url = new URL(input)
    const host = url.hostname.replace(/^www\./, '')
    let candidate: string | null = null

    if (host === 'youtu.be') {
      candidate = url.pathname.split('/').filter(Boolean)[0] ?? null
    } else if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      const [firstPathSegment, videoPathSegment] = url.pathname.split('/').filter(Boolean)

      if (url.pathname === '/watch') {
        candidate = url.searchParams.get('v')
      } else if (firstPathSegment === 'embed' || firstPathSegment === 'shorts' || firstPathSegment === 'live') {
        candidate = videoPathSegment ?? null
      }
    }

    return candidate && isYouTubeVideoId(candidate) ? candidate : null
  } catch {
    return null
  }
}

export function YouTubePlayer({ videoId, onReady, onStateChange }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasLoadError, setHasLoadError] = useState(false)
  const resolvedVideoId = extractYouTubeVideoId(videoId)

  useEffect(() => {
    if (!resolvedVideoId || !containerRef.current) {
      return
    }

    let isActive = true
    let player: YT.Player | undefined
    setHasLoadError(false)

    void loadYouTubeIframeApi()
      .then(() => {
        if (!isActive || !containerRef.current || !window.YT) {
          return
        }

        player = new window.YT.Player(containerRef.current, {
          height: '100%',
          width: '100%',
          videoId: resolvedVideoId,
          playerVars: {
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => onReady?.(event.target),
            onStateChange: (event) => onStateChange?.({
              player: event.target,
              state: event.data,
              currentTime: event.target.getCurrentTime(),
            }),
            onError: () => setHasLoadError(true),
          },
        })
      })
      .catch(() => {
        if (isActive) {
          setHasLoadError(true)
        }
      })

    return () => {
      isActive = false
      player?.destroy()
    }
  }, [onReady, onStateChange, resolvedVideoId])

  if (!videoId) {
    return <div className="grid aspect-video place-items-center rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-slate-400"><p className="text-sm">No YouTube video has been selected.</p></div>
  }

  if (!resolvedVideoId || hasLoadError) {
    return <div className="grid aspect-video place-items-center rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-slate-400"><p className="text-sm">This YouTube video could not be loaded.</p></div>
  }

  return <div className="aspect-video overflow-hidden rounded-xl border border-slate-800 bg-slate-950 [&>iframe]:h-full [&>iframe]:w-full"><div key={resolvedVideoId} ref={containerRef} className="h-full w-full" /></div>
}
