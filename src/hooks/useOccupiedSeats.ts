import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// Fetch occupied seats for a specific show
export const useOccupiedSeats = (showId: string | undefined) => {
  return useQuery({
    queryKey: ['occupiedSeats', showId],
    queryFn: async () => {
      if (!showId) throw new Error('Show ID is required');

      const response = await api.get(`/booking/seats/${showId}`);

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch occupied seats');
      }

      return response.data.occupiedSeats || [];
    },
    enabled: !!showId,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
};