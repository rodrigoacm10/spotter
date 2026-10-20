import { apiClient } from './apiClient'
import type { LocationOption, AnalyzeTripParams, TripAnalysisResponse } from '@/shared/types'

export const tripService = {
  async searchLocations(query: string, limit: number = 5): Promise<LocationOption[]> {
    if (!query || query.trim().length < 2) {
      return []
    }
    const response = await apiClient.get<LocationOption[]>('/geocode/', {
      params: { q: query.trim(), limit },
    })
    return response.data
  },

  async analyzeTrip(params: AnalyzeTripParams): Promise<TripAnalysisResponse> {
    const response = await apiClient.post<TripAnalysisResponse>('/routes/analyze/', params)
    return response.data
  },
}

export const searchLocations = tripService.searchLocations
export const analyzeTrip = tripService.analyzeTrip
