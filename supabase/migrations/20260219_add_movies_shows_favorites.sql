-- Add missing column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS image TEXT;

-- Create movies table for TMDB data
CREATE TABLE IF NOT EXISTS public.movies (
  id TEXT NOT NULL PRIMARY KEY,
  title TEXT NOT NULL,
  overview TEXT,
  poster_path TEXT,
  backdrop_path TEXT,
  release_date TEXT,
  original_language TEXT,
  tagline TEXT,
  genres JSONB DEFAULT '[]'::jsonb,
  casts JSONB DEFAULT '[]'::jsonb,
  vote_average DECIMAL(3,1),
  runtime INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shows table for movie showtimes
CREATE TABLE IF NOT EXISTS public.shows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id TEXT NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  show_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  show_price INTEGER NOT NULL,
  occupied_seats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create favorites table for user favorites
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id TEXT NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

-- Add show_id to bookings if it doesn't exist
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS show_id UUID REFERENCES public.shows(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Movies policies (public read access)
CREATE POLICY IF NOT EXISTS "Anyone can view movies"
ON public.movies FOR SELECT
USING (true);

-- Shows policies (public read access)
CREATE POLICY IF NOT EXISTS "Anyone can view shows"
ON public.shows FOR SELECT
USING (true);

-- Favorites policies (users can only see their own)
CREATE POLICY IF NOT EXISTS "Users can view their own favorites"
ON public.favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own favorites"
ON public.favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own favorites"
ON public.favorites FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shows_movie_id ON public.shows(movie_id);
CREATE INDEX IF NOT EXISTS idx_shows_date ON public.shows(show_date_time);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_movie_id ON public.favorites(movie_id);

-- Create trigger for updating movies.updated_at
CREATE OR REPLACE FUNCTION public.update_movies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_movies_updated_at
BEFORE UPDATE ON public.movies
FOR EACH ROW
EXECUTE FUNCTION public.update_movies_updated_at();

-- Create trigger for updating shows.updated_at
CREATE OR REPLACE FUNCTION public.update_shows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_shows_updated_at
BEFORE UPDATE ON public.shows
FOR EACH ROW
EXECUTE FUNCTION public.update_shows_updated_at();
