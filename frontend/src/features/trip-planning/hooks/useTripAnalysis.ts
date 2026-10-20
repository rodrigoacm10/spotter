import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { analyzeTrip } from '@/services'
import type { AnalyzeTripParams, TripAnalysisResponse } from '@/shared/types'

interface UseTripAnalysisOptions {
  onSuccess?: (data: TripAnalysisResponse) => void
  onError?: (errorMessage: string) => void
}

export function useTripAnalysis(options?: UseTripAnalysisOptions) {
  const [tripData, setTripData] = useState<TripAnalysisResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (params: AnalyzeTripParams) => analyzeTrip(params),
    onSuccess: (data) => {
      setTripData(data)
      setErrorMessage(null)
      options?.onSuccess?.(data)
    },
    onError: (error: unknown) => {
      console.error('Failed to analyze trip:', error)
      let userErrorMessage = 'Failed to connect to backend to analyze routes.'
      if (axios.isAxiosError(error)) {
        userErrorMessage = error.response?.data?.error || error.message || userErrorMessage
      } else if (error instanceof Error) {
        userErrorMessage = error.message
      }
      setErrorMessage(userErrorMessage)
      options?.onError?.(userErrorMessage)
    },
  })

  return {
    analyzeTrip: mutation.mutate,
    analyzeTripAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    tripData,
    setTripData,
    errorMessage,
    clearError: () => setErrorMessage(null),
  }
}
