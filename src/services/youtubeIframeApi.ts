const apiScriptId = 'youtube-iframe-api'
let apiLoadPromise: Promise<void> | undefined

export function loadYouTubeIframeApi(): Promise<void> {
  if (window.YT?.Player) {
    return Promise.resolve()
  }

  if (apiLoadPromise) {
    return apiLoadPromise
  }

  apiLoadPromise = new Promise((resolve, reject) => {
    const previousReadyHandler = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previousReadyHandler?.()
      resolve()
    }

    const existingScript = document.getElementById(apiScriptId)

    if (existingScript) {
      return
    }

    const script = document.createElement('script')
    script.id = apiScriptId
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.onerror = () => {
      apiLoadPromise = undefined
      reject(new Error('Unable to load the YouTube IFrame Player API.'))
    }
    document.head.append(script)
  })

  return apiLoadPromise
}
