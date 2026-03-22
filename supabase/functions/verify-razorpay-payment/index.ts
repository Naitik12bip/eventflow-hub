import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

// ✅ ENV VARIABLES (FAIL EARLY)
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing Supabase environment variables");
}

if (!razorpayKeySecret) {
  throw new Error("Missing Razorpay secret");
}

// ✅ SUPABASE ADMIN CLIENT (NEVER NULL)
const supabaseAdmin = createClient(supabaseUrl, serviceKey);

// ✅ CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ✅ TYPES
interface VerifyPaymentRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  bookingId?: string;
}

// ✅ SERVER
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ✅ AUTH HEADER CHECK
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // ✅ SECURE USER FETCH (NO MANUAL JWT DECODE)
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // ✅ REQUEST BODY
    const body: VerifyPaymentRequest = await req.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      bookingId,
    } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Missing payment details" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Verifying payment:", {
      razorpay_order_id,
      razorpay_payment_id,
      userId,
    });

    // ✅ SIGNATURE VERIFY
    const expectedSignature = createHmac("sha256", razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValidSignature = expectedSignature === razorpay_signature;

    // ❌ INVALID SIGNATURE
    if (!isValidSignature) {
      console.error("Invalid signature");

      if (bookingId) {
        await supabaseAdmin
          .from("bookings")
          .update({ status: "failed" })
          .eq("id", bookingId)
          .eq("user_id", userId);
      }

      await supabaseAdmin
        .from("payments")
        .update({ status: "failed" })
        .eq("razorpay_order_id", razorpay_order_id)
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({ success: false, error: "Verification failed" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ✅ SUCCESS
    console.log("Payment verified");

    // UPDATE BOOKING
    if (bookingId) {
      const { error: bookingError } = await supabaseAdmin
        .from("bookings")
        .update({
          status: "confirmed",
          razorpay_order_id,
          razorpay_payment_id,
        })
        .eq("id", bookingId)
        .eq("user_id", userId);

      if (bookingError) {
        console.error("Booking update error:", bookingError);
      }
    }

    // UPDATE PAYMENT
    const { error: paymentError } = await supabaseAdmin
      .from("payments")
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: "completed",
        payment_date: new Date().toISOString(),
      })
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("user_id", userId);

    if (paymentError) {
      console.error("Payment update error:", paymentError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified successfully",
        bookingId: bookingId ?? null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Server error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});