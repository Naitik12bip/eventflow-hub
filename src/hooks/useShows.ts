import { useQuery } from '@tanstack/react-query';
import { Event, EventCategory } from '@/data/events';
import { dummyShowsData, DummyShow } from '@/data/dummyData';

// Backend show type (kept for reference)
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

// Map dummy show to Event format
const mapDummyShowToEvent = (show: DummyShow): Event => {
  // Generate a show date in the next 7 days
  const today = new Date();
  const randomDays = Math.floor(Math.random() * 7);
  const showDate = new Date(today);
  showDate.setDate(showDate.getDate() + randomDays);

  return {
    id: show._id,
    title: show.title,
    description: show.overview,
    category: 'movies' as EventCategory,
    venue: 'Cinema Hall',
    city: 'Ahmedabad',
    date: showDate.toISOString().split('T')[0],
    time: '18:00',
    image: show.poster_path,
    price: {
      min: 150,
      max: 350,
    },
    rating: show.vote_average,
    duration: `${show.runtime} min`,
    featured: show.vote_average >= 7.0,
    seatsAvailable: 90,
    totalSeats: 96,
    genre: show.genres?.[0]?.name || 'Movie',
  };
};

// Dummy data hook - returns static data without API calls
export const useShows = () => {
  return useQuery<ShowsQueryResult>({
    queryKey: ['shows'],
    queryFn: async () => {
      // Simulate a small delay for realistic loading state
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Map dummy data to Event format
      const mappedEvents = dummyShowsData.map(mapDummyShowToEvent);

      return {
        events: mappedEvents,
        isFallbackData: true, // Always true since we're using dummy data
      };
    },
    staleTime: Infinity, // Never stale since it's static data
    gcTime: Infinity, // Keep in cache forever
  });
};
