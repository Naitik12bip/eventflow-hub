 import { useQuery } from '@tanstack/react-query';
 import api, { getTMDBImageUrl } from '@/lib/api';
 import { Event, EventCategory } from '@/data/events';
 
 // Interface for the backend show response
 interface BackendShow {
   _id: string;
   movieId: number;
   showDateTime: string;
   showPrice: number;
   occupiedSeats: string[];
   movie: {
     id: number;
     title: string;
     overview: string;
     poster_path: string | null;
     backdrop_path: string | null;
     vote_average: number;
     runtime: number;
     genres: Array<{ id: number; name: string }>;
     release_date: string;
   };
 }
 
 // Map backend show to frontend Event format
 const mapShowToEvent = (show: BackendShow): Event => {
   const showDate = new Date(show.showDateTime);
   
   return {
     id: show._id,
     title: show.movie.title,
     description: show.movie.overview,
     category: 'movies' as EventCategory,
     venue: 'Cinema Hall', // Default venue, can be extended
     city: 'Your City',
     date: showDate.toISOString().split('T')[0],
     time: showDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
     image: getTMDBImageUrl(show.movie.poster_path),
     price: {
       min: show.showPrice,
       max: show.showPrice * 2, // VIP pricing
     },
     rating: show.movie.vote_average,
     duration: `${show.movie.runtime} min`,
     featured: show.movie.vote_average >= 7.5,
     seatsAvailable: 96 - show.occupiedSeats.length, // Assuming 96 total seats
     totalSeats: 96,
     genre: show.movie.genres[0]?.name || 'Movie',
   };
 };
 
 // Fetch all shows from the backend
 export const useShows = () => {
   return useQuery({
     queryKey: ['shows'],
     queryFn: async () => {
       const response = await api.get<BackendShow[]>('/show/all');
       return response.data.map(mapShowToEvent);
     },
     staleTime: 5 * 60 * 1000, // 5 minutes
   });
 };
 
 // Export the backend show type for use in other hooks
 export type { BackendShow };