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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized - No token provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Decode Clerk JWT
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
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("Authenticated user:", userId);

    const body: CreateOrderRequest = await req.json();
    const { eventId, showId, seatIds, ticketPrice } = body;

    console.log("Create order request:", {
      eventId,
      showId,
      seatIds,
      ticketPrice,
    });

    // ✅ Improved validation
    if (
      !eventId ||
      !showId ||
      !seatIds ||
      seatIds.length === 0 ||
      ticketPrice == null
    ) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: eventId, showId, seatIds, ticketPrice",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const quantity = seatIds.length;
    const subtotal = ticketPrice * quantity;
    const convenienceFee = Math.round(subtotal * 0.05);
    const totalAmount = subtotal + convenienceFee;
    const amountInPaise = totalAmount * 100;

    console.log("Calculated amounts:", {
      quantity,
      subtotal,
      convenienceFee,
      totalAmount,
      amountInPaise,
    });

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error("Razorpay credentials not configured");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const razorpayOrder = await razorpayResponse.json();
    console.log("Razorpay order created:", razorpayOrder.id);

    // ✅ Safe ENV validation
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("❌ Missing Supabase ENV variables");
      return new Response(
        JSON.stringify({ error: "Server misconfiguration" }),
        { status: 500, headers: corsHeaders },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // ✅ Log payload (helps debugging NOT NULL errors)
    console.log("Booking payload:", {
      user_id: userId,
      event_id: eventId,
      total_amount: totalAmount,
      convenience_fee: convenienceFee,
      status: "pending",
    });

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

    // ✅ FIX 1 — REAL ERROR EXPOSURE
    if (bookingError) {
      console.error("❌ BOOKING INSERT FAILED:");
      console.error("Message:", bookingError.message);
      console.error("Details:", bookingError.details);
      console.error("Hint:", bookingError.hint);
      console.error("Code:", bookingError.code);

      return new Response(
        JSON.stringify({
          error: "Failed to create booking record",
          debug: bookingError,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("Booking created:", booking.id);

    const { error: paymentError } = await supabaseAdmin.from("payments").insert({
      user_id: userId,
      booking_id: booking.id,
      razorpay_order_id: razorpayOrder.id,
      amount: totalAmount,
      status: "pending",
    });

    if (paymentError) {
      console.error("Failed to create payment record:", paymentError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: "INR",
        bookingId: booking.id,
        keyId: razorpayKeyId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in create-razorpay-order:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
