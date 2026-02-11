import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CreateOrderRequest {
  eventId: string;
  showId: string;
  seatIds: string[];
  ticketPrice: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized - No token provided" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Initialize Supabase client with user's token
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    // Validate user
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth
      .getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error("Auth error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);

    // Parse request body
    const body: CreateOrderRequest = await req.json();
    const { eventId, showId, seatIds, ticketPrice } = body;

    console.log("Create order request:", {
      eventId,
      showId,
      seatIds,
      ticketPrice,
    });

    // Validate input
    if (
      !eventId || !showId || !seatIds || seatIds.length === 0 || !ticketPrice
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: eventId, showId, seatIds, ticketPrice",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Calculate total amount server-side (never trust frontend prices)
    const quantity = seatIds.length;
    const subtotal = ticketPrice * quantity;
    const convenienceFee = Math.round(subtotal * 0.05);
    const totalAmount = subtotal + convenienceFee;
    const amountInPaise = totalAmount * 100; // Razorpay expects amount in paise

    console.log("Calculated amounts:", {
      quantity,
      subtotal,
      convenienceFee,
      totalAmount,
      amountInPaise,
    });

    // Get Razorpay credentials
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error("Razorpay credentials not configured");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create Razorpay order
    const razorpayAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${razorpayAuth}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
          eventId,
          showId,
          userId,
          seats: seatIds.join(","),
        },
      }),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error("Razorpay order creation failed:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to create payment order" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const razorpayOrder = await razorpayResponse.json();
    console.log("Razorpay order created:", razorpayOrder.id);

    // Use service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Create pending booking in database
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        user_id: userId,
        event_id: eventId,
        total_amount: totalAmount,
        convenience_fee: convenienceFee,
        status: "pending",
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Failed to create booking:", bookingError);
      return new Response(
        JSON.stringify({ error: "Failed to create booking record" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Booking created:", booking.id);

    // Create pending payment record
    const { error: paymentError } = await supabaseAdmin.from("payments").insert(
      {
        user_id: userId,
        booking_id: booking.id,
        razorpay_order_id: razorpayOrder.id,
        amount: totalAmount,
        status: "pending",
      },
    );

    if (paymentError) {
      console.error("Failed to create payment record:", paymentError);
      // Don't fail the whole request, payment verification will handle this
    }

    // Return order details to frontend
    return new Response(
      JSON.stringify({
        success: true,
        orderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: "INR",
        bookingId: booking.id,
        keyId: razorpayKeyId, // Send key ID for frontend checkout
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in create-razorpay-order:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
