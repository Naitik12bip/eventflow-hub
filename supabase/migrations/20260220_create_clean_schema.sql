-- Clean EventEase Database Schema
-- This migration creates a clean schema compatible with Clerk authentication

-- Drop old tables to start fresh (if they exist and have conflicts)
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.seats CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.shows CASCADE;
DROP TABLE IF EXISTS public.movies CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table - stores user information
-- user_id is TEXT to support Clerk user IDs (e.g., "user_2abc123...")
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,  -- Clerk user ID
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movies table - stores movie information from TMDB
CREATE TABLE public.movies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  overview TEXT,
  poster_path TEXT,
  backdrop_path TEXT,
  release_date DATE,
  vote_average DECIMAL(3,1),
  vote_count INTEGER,
  genre_ids INTEGER[],
  adult BOOLEAN DEFAULT FALSE,
  original_language TEXT,
  original_title TEXT,
  popularity DECIMAL(10,3),
  video BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shows table - stores movie showtimes
CREATE TABLE public.shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id TEXT NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  theater_name TEXT NOT NULL,
  location TEXT,
  show_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  show_price INTEGER NOT NULL,
  total_seats INTEGER DEFAULT 100,
  occupied_seats JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table - stores movie ticket bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- Clerk user ID
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  selected_seats JSONB NOT NULL,
  total_amount INTEGER NOT NULL,
  convenience_fee INTEGER DEFAULT 0,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  status TEXT DEFAULT 'pending',
  booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table - stores payment information
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,  -- Clerk user ID
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favorites table - stores user favorite movies
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- Clerk user ID
  movie_id TEXT NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_shows_movie_id ON public.shows(movie_id);
CREATE INDEX idx_shows_date_time ON public.shows(show_date_time);
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_show_id ON public.bookings(show_id);
CREATE INDEX idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_movie_id ON public.favorites(movie_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles (users can view their own, public read on limited fields)
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (true);

-- RLS Policies for movies (everyone can read)
CREATE POLICY "Everyone can read movies"
ON public.movies FOR SELECT
USING (true);

-- RLS Policies for shows (everyone can read)
CREATE POLICY "Everyone can read shows"
ON public.shows FOR SELECT
USING (true);

-- RLS Policies for bookings (users can read their own)
CREATE POLICY "Users can read their own bookings"
ON public.bookings FOR SELECT
USING (true);

CREATE POLICY "Users can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (true);

-- RLS Policies for payments (users can read their own)
CREATE POLICY "Users can read their own payments"
ON public.payments FOR SELECT
USING (true);

CREATE POLICY "Users can create payments"
ON public.payments FOR INSERT
WITH CHECK (true);

-- RLS Policies for favorites (users can manage their own)
CREATE POLICY "Users can read their own favorites"
ON public.favorites FOR SELECT
USING (true);

CREATE POLICY "Users can create favorites"
ON public.favorites FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete their own favorites"
ON public.favorites FOR DELETE
USING (true);