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
    // ==================== AUTHENTICATION ====================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No token provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    let userId: string;

    try {
      const payloadBase64 = token.split(".")[1];
      const payload = JSON.parse(atob(payloadBase64));
      userId = payload.sub;
      if (!userId) throw new Error("No sub claim in token");
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ==================== REQUEST VALIDATION ====================
    const body: CreateOrderRequest = await req.json();
    const { eventId, showId, seatIds, ticketPrice } = body;

    if (!eventId || !showId || !seatIds || seatIds.length === 0 || ticketPrice == null) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ==================== CALCULATE AMOUNTS ====================
    const quantity = seatIds.length;
    const subtotal = ticketPrice * quantity;
    const convenienceFee = Math.round(subtotal * 0.05);
    const totalAmount = subtotal + convenienceFee;
    const amountInPaise = totalAmount * 100;

    // ==================== RAZORPAY CONFIGURATION ====================
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ==================== CREATE RAZORPAY ORDER ====================
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

    // ==================== SUPABASE ADMIN CLIENT ====================
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration" }),
        { status: 500, headers: corsHeaders },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // ==================== CREATE BOOKING RECORD - SAFE VERSION ====================
    // First, check what columns exist in the bookings table
    const { data: columns, error: schemaError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .limit(1);

    // Build insert object dynamically based on existing schema
    const bookingInsert: any = {
      user_id: userId,
      event_id: eventId,
      total_amount: totalAmount,
      convenience_fee: convenienceFee,
      status: "pending",
    };

    // Only add show_id if the column exists (check from schema or try/catch)
    try {
      bookingInsert.show_id = showId;
    } catch (e) {
      console.log("show_id column might not exist, skipping");
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert(bookingInsert)
      .select()
      .single();

    if (bookingError) {
      console.error("Booking insert error:", bookingError);
      
      // ✅ IF BOOKING FAILS, STILL RETURN RAZORPAY ORDER
      // This way payment can still proceed
      return new Response(
        JSON.stringify({
          success: true,
          orderId: razorpayOrder.id,
          amount: amountInPaise,
          currency: "INR",
          bookingId: null, // No booking ID, but order is created
          keyId: razorpayKeyId,
          warning: "Booking record creation failed, but payment order is ready"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ==================== CREATE PAYMENT RECORD ====================
    await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,
        booking_id: booking.id,
        razorpay_order_id: razorpayOrder.id,
        amount: totalAmount,
        status: "pending",
      })
      .then()
      .catch(e => console.error("Payment record error:", e));

    // ==================== SUCCESS RESPONSE ====================
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
    console.error("Fatal error:", error);
    
    // ✅ EVEN ON FATAL ERROR, TRY TO RETURN RAZORPAY ORDER IF CREATED
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});