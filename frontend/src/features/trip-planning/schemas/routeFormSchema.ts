import { z } from 'zod'
import dayjs, { Dayjs } from 'dayjs'
import type { LocationOption } from '@/shared/types'

export const locationOptionSchema = z.object({
  display_name: z.string().min(1, 'Location name is required'),
  latitude: z.number(),
  longitude: z.number(),
  type: z.string().optional(),
})

export const routeFormSchema = z.object({
  origin: locationOptionSchema.nullable().refine((locationOption): locationOption is LocationOption => locationOption !== null, {
    message: 'Origin departure point is required',
  }),
  dest: locationOptionSchema.nullable().refine((locationOption): locationOption is LocationOption => locationOption !== null, {
    message: 'Destination arrival point is required',
  }),
  departureTime: z.custom<Dayjs | null>(
    (dateValue) => dateValue !== null && dayjs.isDayjs(dateValue) && dateValue.isValid(),
    { message: 'Valid departure date & time is required' }
  ),
  weight: z
    .number()
    .min(5000, 'Minimum cargo load is 5,000 lbs')
    .max(60000, 'Maximum cargo load is 60,000 lbs'),
  interval: z.union([z.literal(10), z.literal(25), z.literal(50)]),
})

export type RouteFormData = {
  origin: LocationOption | null
  dest: LocationOption | null
  departureTime: Dayjs | null
  weight: number
  interval: 10 | 25 | 50
}
