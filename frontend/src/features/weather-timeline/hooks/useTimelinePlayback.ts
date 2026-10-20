import { useState, useEffect, useCallback } from 'react'

interface UseTimelinePlaybackOptions {
  currentHour: number
  onChangeHour: (hour: number | ((previousHour: number) => number)) => void
  maxHour?: number
  stepMs?: number
}

export function useTimelinePlayback({
  currentHour,
  onChangeHour,
  maxHour = 47,
  stepMs = 700,
}: UseTimelinePlaybackOptions) {
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (!isPlaying) return

    const timer = setInterval(() => {
      onChangeHour((previousHour) => {
        if (previousHour >= maxHour) {
          setIsPlaying(false)
          return maxHour
        }
        return previousHour + 1
      })
    }, stepMs)

    return () => clearInterval(timer)
  }, [isPlaying, onChangeHour, maxHour, stepMs])

  const togglePlay = useCallback(() => {
    setIsPlaying((previouslyPlaying) => {
      // If we are at the end and press play, restart from 0
      if (!previouslyPlaying && currentHour >= maxHour) {
        onChangeHour(0)
      }
      return !previouslyPlaying
    })
  }, [currentHour, maxHour, onChangeHour])

  const resetToStart = useCallback(() => {
    setIsPlaying(false)
    onChangeHour(0)
  }, [onChangeHour])

  return {
    isPlaying,
    setIsPlaying,
    togglePlay,
    resetToStart,
  }
}
