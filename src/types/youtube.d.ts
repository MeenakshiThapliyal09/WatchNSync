declare namespace YT {
  interface Player {
    destroy(): void
    getCurrentTime(): number
    getPlayerState(): number
    pauseVideo(): void
    playVideo(): void
    seekTo(seconds: number, allowSeekAhead: boolean): void
  }

  interface PlayerEvent {
    target: Player
  }

  interface OnStateChangeEvent extends PlayerEvent {
    data: number
  }

  interface OnErrorEvent extends PlayerEvent {
    data: number
  }

  interface PlayerOptions {
    height?: string | number
    width?: string | number
    videoId?: string
    playerVars?: Record<string, number | string>
    events?: {
      onReady?: (event: PlayerEvent) => void
      onStateChange?: (event: OnStateChangeEvent) => void
      onError?: (event: OnErrorEvent) => void
    }
  }

  class Player {
    constructor(element: HTMLElement, options: PlayerOptions)
  }
}

interface Window {
  YT?: typeof YT
  onYouTubeIframeAPIReady?: () => void
}
