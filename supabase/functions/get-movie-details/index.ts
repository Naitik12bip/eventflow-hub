import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get movie ID from URL
    const url = new URL(req.url);
    const movieId = url.searchParams.get("movieId");

    if (!movieId) {
      return new Response(
        JSON.stringify({ error: "Movie ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get movie details
    const { data: movie, error: movieError } = await supabase
      .from("movies")
      .select("*")
      .eq("id", movieId)
      .single();

    if (movieError || !movie) {
      throw new Error("Movie not found");
    }

    // Get all shows for this movie with future dates
    const { data: shows, error: showsError } = await supabase
      .from("shows")
      .select("*")
      .eq("movie_id", movieId)
      .gte("show_date_time", new Date().toISOString())
      .order("show_date_time", { ascending: true });

    if (showsError) {
      console.error("Shows error:", showsError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        movie,
        shows: shows || [],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
