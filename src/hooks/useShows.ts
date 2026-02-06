import { useQuery } from '@tanstack/react-query';
import api, { getTMDBImageUrl } from '@/lib/api';
import { Event, EventCategory, events as mockEvents } from '@/data/events';

// Backend show type
export interface BackendShow {
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
    vote_average: number;
    runtime: number;
    genres: { id: number; name: string }[];
    release_date: string;
  };
}

// Mapper
const mapShowToEvent = (show: BackendShow): Event => {
  const showDate = new Date(show.showDateTime);

  return {
    id: show._id,
    title: show.movie.title,
    description: show.movie.overview,
    category: 'movies' as EventCategory,
    venue: 'Cinema Hall',
    city: 'Ahmedabad',
    date: showDate.toISOString().split('T')[0],
    time: showDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    image: getTMDBImageUrl(show.movie.poster_path),
    price: {
      min: show.showPrice,
      max: show.showPrice,
    },
    rating: show.movie.vote_average,
    duration: `${show.movie.runtime} min`,
    featured: show.movie.vote_average >= 7.5,
    seatsAvailable: 96 - show.occupiedSeats.length,
    totalSeats: 96,
    genre: show.movie.genres?.[0]?.name || 'Movie',
  };
};

// API response wrapper
interface ShowsResponse {
  success: boolean;
  shows: BackendShow[];
}

// Hook with fallback to mock data
export const useShows = () => {
  return useQuery({
    queryKey: ['shows'],
    queryFn: async () => {
      try {
        const res = await api.get<ShowsResponse>('/show/all');
        if (!res.data.success) throw new Error('Failed to fetch shows');
        return res.data.shows.map(mapShowToEvent);
      } catch (error) {
        console.warn('Backend unreachable, using demo data:', error);
        // Return mock events as fallback
        return mockEvents;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1, // Only retry once before using fallback
  });
};
