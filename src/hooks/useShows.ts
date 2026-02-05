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

// Hook
export const useShows = () => {
  return useQuery({
    queryKey: ['shows'],
    queryFn: async () => {
      const res = await api.get<BackendShow[]>('/show/all');
      return res.data.map(mapShowToEvent);
    },
    staleTime: 5 * 60 * 1000,
  });
};
