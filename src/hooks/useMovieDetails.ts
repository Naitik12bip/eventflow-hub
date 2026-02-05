 import { useQuery } from '@tanstack/react-query';
 import api, { getTMDBImageUrl } from '@/lib/api';
 
 // Backend response for movie details with shows
 interface MovieDetailsResponse {
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
   shows: Array<{
     _id: string;
     movieId: number;
     showDateTime: string;
     showPrice: number;
     occupiedSeats: string[];
   }>;
 }
 
 export interface ShowTime {
   id: string;
   dateTime: Date;
   price: number;
   occupiedSeats: string[];
   formattedDate: string;
   formattedTime: string;
 }
 
 export interface MovieDetails {
   id: number;
   title: string;
   description: string;
   image: string;
   backdropImage: string;
   rating: number;
   duration: string;
   genres: string[];
   releaseDate: string;
   shows: ShowTime[];
 }
 
 // Fetch movie details with available shows
 export const useMovieDetails = (movieId: string | undefined) => {
   return useQuery({
     queryKey: ['movieDetails', movieId],
     queryFn: async (): Promise<MovieDetails> => {
       if (!movieId) throw new Error('Movie ID is required');
       
       const response = await api.get<MovieDetailsResponse>(`/show/${movieId}`);
       const { movie, shows } = response.data;
       
       return {
         id: movie.id,
         title: movie.title,
         description: movie.overview,
         image: getTMDBImageUrl(movie.poster_path),
         backdropImage: getTMDBImageUrl(movie.backdrop_path),
         rating: movie.vote_average,
         duration: `${movie.runtime} min`,
         genres: movie.genres.map(g => g.name),
         releaseDate: movie.release_date,
         shows: shows.map(show => {
           const dateTime = new Date(show.showDateTime);
           return {
             id: show._id,
             dateTime,
             price: show.showPrice,
             occupiedSeats: show.occupiedSeats,
             formattedDate: dateTime.toLocaleDateString('en-IN', {
               weekday: 'short',
               day: 'numeric',
               month: 'short',
             }),
             formattedTime: dateTime.toLocaleTimeString('en-IN', {
               hour: '2-digit',
               minute: '2-digit',
             }),
           };
         }),
       };
     },
     enabled: !!movieId,
     staleTime: 5 * 60 * 1000,
   });
 };