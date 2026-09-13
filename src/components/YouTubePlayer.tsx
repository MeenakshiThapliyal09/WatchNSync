import { useEffect, useRef, useState } from 'react'
import { loadYouTubeIframeApi } from '../services/youtubeIframeApi'

export interface YouTubePlayerStateChange {
  player: YT.Player
  state: number
  currentTime: number
}

interface YouTubePlayerProps {
  videoId: string | null | undefined
  playState: 'paused' | 'playing'
  currentTime: number
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

function applyPlaybackState(player: YT.Player, playState: YouTubePlayerProps['playState'], currentTime: number) {
  player.seekTo(currentTime, true)

  if (playState === 'playing') {
    player.playVideo()
  } else {
    player.pauseVideo()
  }
}

export function YouTubePlayer({
  videoId,
  playState,
  currentTime,
  onReady,
  onStateChange,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YT.Player | null>(null)
  const playerVideoIdRef = useRef<string | null>(null)
  const isPlayerReadyRef = useRef(false)
  const callbacksRef = useRef({ onReady, onStateChange })
  const playbackStateRef = useRef({ playState, currentTime })
  const [hasLoadError, setHasLoadError] = useState(false)
  const resolvedVideoId = extractYouTubeVideoId(videoId)

  callbacksRef.current = { onReady, onStateChange }
  playbackStateRef.current = { playState, currentTime }

  useEffect(() => {
    if (!resolvedVideoId || !containerRef.current) {
      return
    }

    let isActive = true
    setHasLoadError(false)

    void loadYouTubeIframeApi()
      .then(() => {
        if (!isActive || !containerRef.current || !window.YT) {
          return
        }

        if (playerRef.current) {
          if (playerVideoIdRef.current !== resolvedVideoId) {
            playerRef.current.cueVideoById(resolvedVideoId)
            playerVideoIdRef.current = resolvedVideoId
          }

          if (isPlayerReadyRef.current) {
            const playbackState = playbackStateRef.current
            applyPlaybackState(
              playerRef.current,
              playbackState.playState,
              playbackState.currentTime,
            )
          }
          return
        }

        const player = new window.YT.Player(containerRef.current, {
          height: '100%',
          width: '100%',
          videoId: resolvedVideoId,
          playerVars: {
            controls: 0,
            disablekb: 1,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              playerRef.current = event.target
              playerVideoIdRef.current = resolvedVideoId
              isPlayerReadyRef.current = true
              const playbackState = playbackStateRef.current
              applyPlaybackState(
                event.target,
                playbackState.playState,
                playbackState.currentTime,
              )
              callbacksRef.current.onReady?.(event.target)
            },
            onStateChange: (event) => callbacksRef.current.onStateChange?.({
              player: event.target,
              state: event.data,
              currentTime: event.target.getCurrentTime(),
            }),
            onError: () => setHasLoadError(true),
          },
        })
        playerRef.current = player
        playerVideoIdRef.current = resolvedVideoId
      })
      .catch(() => {
        if (isActive) {
          setHasLoadError(true)
        }
      })

    return () => {
      isActive = false
    }
  }, [resolvedVideoId])

  useEffect(() => {
    if (playerRef.current && isPlayerReadyRef.current) {
      applyPlaybackState(playerRef.current, playState, currentTime)
    }
  }, [currentTime, playState])

  useEffect(() => () => {
    playerRef.current?.destroy()
    playerRef.current = null
    isPlayerReadyRef.current = false
  }, [])

  if (!videoId) {
    return <div className="grid aspect-video place-items-center rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-slate-400"><p className="text-sm">No YouTube video has been selected.</p></div>
  }

  if (!resolvedVideoId || hasLoadError) {
    return <div className="grid aspect-video place-items-center rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-slate-400"><p className="text-sm">This YouTube video could not be loaded.</p></div>
  }

  return <div className="aspect-video overflow-hidden rounded-xl border border-slate-800 bg-slate-950 [&>iframe]:h-full [&>iframe]:w-full"><div ref={containerRef} className="h-full w-full" /></div>
}
