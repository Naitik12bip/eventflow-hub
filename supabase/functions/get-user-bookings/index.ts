import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Booking {
  id: string;
  user_id: string;
  show_id: string;
  selected_seats: string[];
  total_amount: number;
  convenience_fee: number;
  status: string;
  booking_date: string;
  created_at: string;
  updated_at: string;
}

interface Show {
  id: string;
  movie_id: string;
  show_date_time: string;
  show_price: number;
  occupied_seats: Record<string, any>;
  theater_name: string;
  location: string;
}

interface Movie {
  id: string;
  title: string;
  poster_path: string;
  overview: string;
  release_date: string;
}

interface Payment {
  id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  status: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  created_at: string;
}

interface BookingResponse {
  id: string;
  movieTitle: string;
  moviePoster: string;
  movieOverview: string;
  theater: string;
  location: string;
  showDateTime: string;
  selectedSeats: string[];
  totalAmount: number;
  convenienceFee: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  razorpayPaymentId: string | null;
  createdAt: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("No authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode Clerk JWT to get user ID
    const token = authHeader.replace("Bearer ", "");
    let userId: string;
    try {
      const payloadBase64 = token.split(".")[1];
      const payload = JSON.parse(atob(payloadBase64));
      userId = payload.sub;
      if (!userId) throw new Error("No sub claim in token");
    } catch (e) {
      console.error("JWT decode error:", e);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("Fetching bookings for user:", userId);

    // Use service role to query across tables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Fetch bookings for this user
    console.log("Fetching bookings for user_id:", userId);
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (bookingsError) {
      console.error("Bookings query error:", bookingsError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch bookings",
          details: bookingsError.message 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${bookings?.length || 0} bookings`);

    if (!bookings || bookings.length === 0) {
      return new Response(
        JSON.stringify({ success: true, bookings: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch shows for all bookings
    const showIds = bookings.map((b) => b.show_id);
    const showsMap: Record<string, Show> = {};
    
    if (showIds.length > 0) {
      console.log(`Fetching ${showIds.length} shows...`);
      const { data: shows, error: showsError } = await supabaseAdmin
        .from("shows")
        .select("*")
        .in("id", showIds);

      if (showsError) {
        console.error("Shows query error:", showsError);
        throw new Error("Failed to fetch shows");
      }
      
      if (shows) {
        for (const show of shows) {
          showsMap[show.id] = show;
        }
        console.log(`Fetched ${shows.length} shows`);
      }
    }

    // Fetch movies for all shows
    const movieIds = Object.values(showsMap).map((s) => s.movie_id);
    const moviesMap: Record<string, Movie> = {};
    
    if (movieIds.length > 0) {
      console.log(`Fetching ${movieIds.length} movies...`);
      const { data: movies, error: moviesError } = await supabaseAdmin
        .from("movies")
        .select("*")
        .in("id", movieIds);

      if (moviesError) {
        console.error("Movies query error:", moviesError);
        throw new Error("Failed to fetch movies");
      }
      
      if (movies) {
        for (const movie of movies) {
          moviesMap[movie.id] = movie;
        }
        console.log(`Fetched ${movies.length} movies`);
      }
    }

    // Fetch payment info
    const bookingIds = bookings.map((b: Booking) => b.id);
    const paymentsMap: Record<string, Payment> = {};

    if (bookingIds.length > 0) {
      console.log(`Fetching payments for ${bookingIds.length} bookings...`);
      const { data: payments, error: paymentsError } = await supabaseAdmin
        .from("payments")
        .select("*")
        .in("booking_id", bookingIds);

      if (paymentsError) {
        console.error("Payments query error:", paymentsError);
      } else if (payments) {
        for (const payment of payments) {
          paymentsMap[payment.booking_id] = payment;
        }
        console.log(`Fetched ${payments.length} payments`);
      }
    }

    // Format response
    const formattedBookings: BookingResponse[] = bookings.map((booking: Booking) => {
      const show = showsMap[booking.show_id];
      const movie = moviesMap[show?.movie_id];
      const payment = paymentsMap[booking.id];

      return {
        id: booking.id,
        movieTitle: movie?.title || "Unknown Movie",
        moviePoster: movie?.poster_path || "/placeholder.svg",
        movieOverview: movie?.overview || "",
        theater: show?.theater_name || "Unknown Theater",
        location: show?.location || "",
        showDateTime: show?.show_date_time || "",
        selectedSeats: booking.selected_seats || [],
        totalAmount: booking.total_amount,
        convenienceFee: booking.convenience_fee,
        totalPrice: booking.total_amount + booking.convenience_fee,
        status: booking.status,
        paymentStatus: payment?.status || "unknown",
        razorpayPaymentId: payment?.razorpay_payment_id || null,
        createdAt: booking.created_at,
      };
    });

    console.log(`Returning ${formattedBookings.length} formatted bookings`);
    
    return new Response(
      JSON.stringify({ success: true, bookings: formattedBookings }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-user-bookings:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});