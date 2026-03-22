import { useQuery } from '@tanstack/react-query';
import { dummyShowsData, dummyDateTimeData, dummyOccupiedSeats } from '@/data/dummyData';
import { supabase } from '@/lib/supabaseClient';
import { getTMDBImageUrl } from '@/lib/api';

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

const formatShowTime = (showId: string, isoDateTime: string, price = 250): ShowTime => {
  const dateTime = new Date(isoDateTime);

  return {
    id: showId,
    dateTime,
    price,
    occupiedSeats: dummyOccupiedSeats[showId] || [],
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
};

const getDummyShowsForMovie = (movieId: string): ShowTime[] => {
  return Object.values(dummyDateTimeData)
    .flatMap((showEntries) =>
      showEntries.map((entry, index) =>
        formatShowTime(`${movieId}_${entry.showId}`, entry.time, 200 + index * 50)
      )
    )
    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
};

const getDummyMovieDetails = (movieId: string): MovieDetails | null => {
  const movie = dummyShowsData.find(
    (dummyMovie) => dummyMovie._id === movieId || dummyMovie.id.toString() === movieId
  );

  if (!movie) {
    return null;
  }

  return {
    id: movie.id,
    title: movie.title,
    description: movie.overview || 'No description available.',
    image: getTMDBImageUrl(movie.poster_path),
    backdropImage: getTMDBImageUrl(movie.backdrop_path),
    rating: movie.vote_average || 0,
    duration: movie.runtime ? `${movie.runtime}m` : '2h',
    genres: movie.genres.map((genre) => genre.name),
    releaseDate: movie.release_date || '',
    shows: getDummyShowsForMovie(movieId),
  };
};

export const useMovieDetails = (movieId: string | undefined) => {
  return useQuery({
    queryKey: ['movieDetails', movieId],
    queryFn: async (): Promise<MovieDetails> => {
      if (!movieId) throw new Error('Movie ID is required');
      const fallbackMovie = getDummyMovieDetails(movieId);

      const { data: movie, error: movieError } = await supabase
        .from('movies')
        .select('*')
        .eq('id', movieId)
        .maybeSingle();

      if (movieError || !movie) {
        if (fallbackMovie) {
          return fallbackMovie;
        }
        throw new Error(movieError?.message || 'Movie not found');
      }

      const { data: dbShows, error: showsError } = await supabase
        .from('shows')
        .select('id, show_date_time, show_price, occupied_seats')
        .eq('movie_id', movieId)
        .gte('show_date_time', new Date().toISOString())
        .order('show_date_time', { ascending: true });
      if (showsError) {
        if (fallbackMovie) {
          return fallbackMovie;
        }
        throw new Error(showsError.message || 'Failed to load showtimes');
      }
      const shows: ShowTime[] = (dbShows || []).map((show) => {
        const dateTime = new Date(show.show_date_time);
        return {
          id: show.id,
          dateTime,
          price: show.show_price,
          occupiedSeats: Object.keys(show.occupied_seats || {}),
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
      });

      return {
        id: Number(movie.id),
        title: movie.title,
        description: movie.overview || 'No description available.',
        image: getTMDBImageUrl(movie.poster_path),
        backdropImage: getTMDBImageUrl(movie.poster_path),
        rating: movie.vote_average || 0,
        duration: '2h',
        genres: ['Movie'],
        releaseDate: movie.release_date || '',
        shows: shows.length > 0 ? shows : fallbackMovie?.shows || [],
      };
    },
    enabled: !!movieId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
