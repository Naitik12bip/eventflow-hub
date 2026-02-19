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
  event_id: string;
  total_amount: number;
  convenience_fee: number;
  status: string;
  booking_date: string;
  created_at: string;
  updated_at: string;
}

interface Ticket {
  id: string;
  booking_id: string;
  seat_id: string;
  event_id: string;
  user_id: string;
  price: number;
  qr_code: string;
  created_at: string;
}

interface Payment {
  id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  status: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  payment_date: string;
  created_at: string;
}

interface EventJoined {
  title: string;
  image_url: string;
  event_date: string;
  event_time: string;
  venue: string;
  city: string;
}

interface SeatJoined {
  seat_row: string;
  seat_number: number;
  seat_type: string;
}

interface TicketJoined extends Ticket {
  seats: SeatJoined;
}

interface BookingJoined extends Booking {
  events: EventJoined;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch bookings with event details
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from("bookings")
      .select(`
        id,
        event_id,
        total_amount,
        convenience_fee,
        status,
        booking_date,
        created_at,
        events (
          id,
          title,
          venue,
          city,
          event_date,
          event_time,
          image_url,
          category,
          genre,
          duration
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (bookingsError) {
      console.error("Failed to fetch bookings:", bookingsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch bookings" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch tickets for each booking to get seat info
    const bookingIds = (bookings || []).map((b: Booking) => b.id);

    const ticketsMap: Record<string, Ticket[]> = {};

    if (bookingIds.length > 0) {
      const { data: tickets, error: ticketsError } = await supabaseAdmin
        .from("tickets")
        .select(`
          id,
          booking_id,
          seat_id,
          price,
          qr_code,
          seats (
            seat_row,
            seat_number,
            seat_type
          )
        `)
        .in("booking_id", bookingIds);

      if (!ticketsError && tickets) {
        for (const ticket of tickets) {
          if (!ticketsMap[ticket.booking_id]) {
            ticketsMap[ticket.booking_id] = [];
          }
          ticketsMap[ticket.booking_id].push(ticket);
        }
      }
    }

    // Fetch payment info
    const paymentsMap: Record<string, Payment> = {};

    if (bookingIds.length > 0) {
      const { data: payments, error: paymentsError } = await supabaseAdmin
        .from("payments")
        .select("booking_id, razorpay_payment_id, amount, status, payment_date")
        .in("booking_id", bookingIds);

      if (!paymentsError && payments) {
        for (const payment of payments) {
          paymentsMap[payment.booking_id] = payment;
        }
      }
    }

    // Format response
    const formattedBookings = (bookings || []).map((booking: BookingJoined) => {
      const event = booking.events;
      const tickets = ticketsMap[booking.id] || [];
      const payment = paymentsMap[booking.id];

      const seats = tickets.map((t: TicketJoined) => {
        const seat = t.seats;
        return seat ? `${seat.seat_row}${seat.seat_number}` : "N/A";
      });

      return {
        id: booking.id,
        eventTitle: event?.title || "Unknown Event",
        eventImage: event?.image_url || "/placeholder.svg",
        venue: event?.venue || "Unknown Venue",
        city: event?.city || "",
        eventDate: event?.event_date || booking.booking_date,
        eventTime: event?.event_time || "",
        category: event?.category || "",
        genre: event?.genre || "",
        duration: event?.duration || "",
        seats,
        ticketCount: tickets.length || 0,
        totalAmount: booking.total_amount,
        convenienceFee: booking.convenience_fee,
        status: booking.status,
        paymentStatus: payment?.status || "unknown",
        paymentId: payment?.razorpay_payment_id || null,
        bookingDate: booking.created_at,
      };
    });

    return new Response(
      JSON.stringify({ success: true, bookings: formattedBookings }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-user-bookings:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});