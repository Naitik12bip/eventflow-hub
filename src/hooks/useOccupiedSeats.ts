import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Fetch occupied seats for a specific show directly from Supabase
export const useOccupiedSeats = (showId: string | undefined) => {
  return useQuery({
    queryKey: ['occupiedSeats', showId],
    queryFn: async () => {
      if (!showId) throw new Error('Show ID is required');

      // Query the shows table to get occupied_seats
      const { data, error } = await supabase
        .from('shows')
        .select('occupied_seats')
        .eq('id', showId)
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to fetch occupied seats');
      }

      if (!data) {
        throw new Error('Show not found');
      }

      // occupied_seats is a JSONB object, extract the seat IDs
      const occupiedSeats = data.occupied_seats || {};
      return Object.keys(occupiedSeats);
    },
    enabled: !!showId,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
};