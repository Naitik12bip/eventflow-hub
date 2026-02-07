import { useQuery } from '@tanstack/react-query';
import { dummyShowsData, dummyDateTimeData, dummyOccupiedSeats } from '@/data/dummyData';

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

// Fetch movie details with available shows using dummy data
export const useMovieDetails = (movieId: string | undefined) => {
  return useQuery({
    queryKey: ['movieDetails', movieId],
    queryFn: async (): Promise<MovieDetails> => {
      if (!movieId) throw new Error('Movie ID is required');

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Find movie in dummy data
      const movie = dummyShowsData.find((m) => m._id === movieId);

      if (!movie) {
        throw new Error('Movie not found');
      }

      // Generate show times from dummyDateTimeData
      const shows: ShowTime[] = [];
      Object.entries(dummyDateTimeData).forEach(([, timeslots]) => {
        timeslots.forEach((slot) => {
          const dateTime = new Date(slot.time);
          shows.push({
            id: slot.showId,
            dateTime,
            price: Math.floor(Math.random() * 150) + 150, // Random price 150-300
            occupiedSeats: dummyOccupiedSeats.show_default || [],
            formattedDate: dateTime.toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            }),
            formattedTime: dateTime.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          });
        });
      });

      return {
        id: movie.id,
        title: movie.title,
        description: movie.overview,
        image: movie.poster_path,
        backdropImage: movie.backdrop_path,
        rating: movie.vote_average,
        duration: `${movie.runtime} min`,
        genres: movie.genres.map((g) => g.name),
        releaseDate: movie.release_date,
        shows,
      };
    },
    enabled: !!movieId,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};
