import { useQuery } from '@tanstack/react-query';
import { Event, EventCategory } from '@/data/events';
import { dummyShowsData, DummyShow } from '@/data/dummyData';
import { supabase } from '@/integrations/supabase/client';
import { getTMDBImageUrl } from '@/lib/api';

export interface ShowsQueryResult {
  events: Event[];
  isFallbackData: boolean;
}
// Map dummy show to Event format
interface MovieWithShows {
  id: string;
  title: string;
  overview: string | null;
  poster_path: string | null;
  vote_average: number | null;
  release_date: string | null;
  shows: {
    id: string;
    show_date_time: string;
    show_price: number;
    occupied_seats: Record<string, boolean> | null;
    total_seats: number;
    theater_name: string;
    location: string;
  }[];
}

const mapDummyShowToEvent = (show: DummyShow): Event => {
  return {
    id: show._id,
    title: show.title,
    description: show.overview,
    category: 'movies' as EventCategory,
    venue: 'Cinema Hall',
    city: 'TBA',
    date: show.release_date || new Date().toISOString().split('T')[0],
    time: 'TBA',
    image: show.poster_path,
    price: {
      min: 150,
      max: 150,
    },
    rating: show.vote_average ?? 0,
    duration: show.runtime ? `${show.runtime}m` : '2h',
    featured: (show.vote_average ?? 0) >= 7.0,
    seatsAvailable: 96,
    totalSeats: 96,
    genre: show.genres?.[0]?.name || 'Movie',
  };
};

const mapMovieToEvent = (movie: MovieWithShows): Event => {
  const firstUpcomingShow = movie.shows
    .map((show) => ({ ...show, date: new Date(show.show_date_time) }))
    .filter((show) => show.date.getTime() >= Date.now())
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

  const occupiedSeats = firstUpcomingShow?.occupied_seats
    ? Object.keys(firstUpcomingShow.occupied_seats)
    : [];
  const totalSeats = firstUpcomingShow?.total_seats ?? 96;
  const seatsAvailable = Math.max(totalSeats - occupiedSeats.length, 0);

  return {
    id: movie.id,
    title: movie.title,
    description: movie.overview || 'No description available.',
    category: 'movies' as EventCategory,
    venue: firstUpcomingShow?.theater_name || 'Cinema Hall',
    city: firstUpcomingShow?.location || 'TBA',
    date: firstUpcomingShow
      ? firstUpcomingShow.date.toISOString().split('T')[0]
      : (movie.release_date || new Date().toISOString().split('T')[0]),
    time: firstUpcomingShow
      ? firstUpcomingShow.date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : 'TBA',
    image: getTMDBImageUrl(movie.poster_path),
    price: {
      min: firstUpcomingShow?.show_price ?? 150,
      max: firstUpcomingShow?.show_price ?? 150,
    },
    rating: movie.vote_average ?? 0,
    duration: '2h',
    featured: (movie.vote_average ?? 0) >= 7.0,
    seatsAvailable,
    totalSeats,
    genre: 'Movie',
  };
};

// Dummy data hook - returns static data without API calls
export const useShows = () => {
  return useQuery<ShowsQueryResult>({
    queryKey: ['shows'],
    queryFn: async () => {
      // Simulate a small delay for realistic loading state
      const { data, error } = await supabase
        .from('movies')
        .select(`
          id,
          title,
          overview,
          poster_path,
          vote_average,
          release_date,
          shows (
            id,
            show_date_time,
            show_price,
            occupied_seats,
            total_seats,
            theater_name,
            location
          )
        `)
        .order('vote_average', { ascending: false });

      if (error) {
        return {
          events: dummyShowsData.map(mapDummyShowToEvent),
          isFallbackData: true,
        };
      }
      // Map dummy data to Event format
      const mappedEvents = ((data || []) as MovieWithShows[]).map(mapMovieToEvent);

      if (mappedEvents.length === 0) {
        return {
          events: dummyShowsData.map(mapDummyShowToEvent),
          isFallbackData: true,
        };
      }
      return {
        events: mappedEvents,
        isFallbackData: false, // Always false since we're using dummy data
      };
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
