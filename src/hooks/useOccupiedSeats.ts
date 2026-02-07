import { useQuery } from '@tanstack/react-query';
import { dummyOccupiedSeats } from '@/data/dummyData';

// Fetch occupied seats for a specific show using dummy data
export const useOccupiedSeats = (showId: string | undefined) => {
  return useQuery({
    queryKey: ['occupiedSeats', showId],
    queryFn: async () => {
      if (!showId) throw new Error('Show ID is required');

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Return dummy occupied seats
      return dummyOccupiedSeats.show_default || [];
    },
    enabled: !!showId,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
};
