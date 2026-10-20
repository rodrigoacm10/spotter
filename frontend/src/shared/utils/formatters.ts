/**
 * Utility functions for formatting dates, durations, and numbers.
 */

export function formatDurationHours(durationHours: number): string {
  const hours = Math.floor(durationHours)
  const minutes = Math.round((durationHours - hours) * 60)
  return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim()
}

export function formatForecastTime(departureTime: string | undefined, hourOffset: number): string {
  const departureDate = departureTime ? new Date(departureTime) : new Date()
  const forecastDate = new Date(departureDate.getTime() + hourOffset * 60 * 60 * 1000)
  return forecastDate.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatEta(etaIso: string): string {
  return new Date(etaIso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
