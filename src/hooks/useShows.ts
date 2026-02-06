import { useQuery } from '@tanstack/react-query';
import api, { getTMDBImageUrl } from '@/lib/api';
import { Event, EventCategory } from '@/data/events';

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

export interface ShowsQueryResult {
  events: Event[];
  isFallbackData: boolean;
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

// Live - data hook 
export const useShows = () => {
  return useQuery<ShowsQueryResult>({ // Expecting { events: Event[], isFallbackData: boolean }
    queryKey: ['shows'],
    queryFn: async () => {
      const res = await api.get<ShowsResponse>('/show/all');
      
      if (!res.data.success) {
        throw new Error('Failed to fetch shows');
      }

      // 1. Map the data as usual
      const mappedEvents = res.data.shows.map(mapShowToEvent);

      // 2. Return the object that matches ShowsQueryResult
      return {
        events: mappedEvents,
        isFallbackData: false // Since this came from the API, it's not fallback data
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};