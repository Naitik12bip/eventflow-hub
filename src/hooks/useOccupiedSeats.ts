 import { useQuery } from '@tanstack/react-query';
 import api from '@/lib/api';
 
 interface OccupiedSeatsResponse {
   occupiedSeats: string[];
 }
 
 // Fetch occupied seats for a specific show
 export const useOccupiedSeats = (showId: string | undefined) => {
   return useQuery({
     queryKey: ['occupiedSeats', showId],
     queryFn: async () => {
       if (!showId) throw new Error('Show ID is required');
       
       const response = await api.get<OccupiedSeatsResponse>(`/booking/seats/${showId}`);
       return response.data.occupiedSeats;
     },
     enabled: !!showId,
     staleTime: 30 * 1000, // 30 seconds - seats change frequently
     refetchInterval: 30 * 1000, // Refetch every 30 seconds
   });
 };