import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchLocations } from '@/services'
import type { LocationOption } from '@/shared/types'

export function useLocationSearch(
  initialInput: string = '',
  initialValue: LocationOption | null = null,
  debounceMs: number = 400
) {
  const [inputValue, setInputValue] = useState(initialInput)
  const [selectedOption, setSelectedOption] = useState<LocationOption | null>(initialValue)
  const [debouncedQuery, setDebouncedQuery] = useState(initialInput)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue.trim())
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [inputValue, debounceMs])

  const { data: options = [], isLoading } = useQuery({
    queryKey: ['locations', debouncedQuery],
    queryFn: () => searchLocations(debouncedQuery, 5),
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 10, // Cache geocoded cities for 10 minutes
  })

  return {
    inputValue,
    setInputValue,
    selectedOption,
    setSelectedOption,
    options: debouncedQuery.length >= 2 ? options : [],
    isLoading,
  }
}
