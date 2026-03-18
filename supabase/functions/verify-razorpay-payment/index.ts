import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing Supabase env");
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VerifyPaymentRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  bookingId: string;
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode Clerk JWT to get user ID
    const token = authHeader.replace("Bearer ", "");
    let userId: string;
    try {
      const parts = token.split(".");
      if (parts.length < 2) {
        throw new Error("Invalid token");
      };

      const payload = JSON.parse(atob(parts[1]));
      userId = payload.sub;

      if (!userId) {
        throw new Error("No sub claim in token");
      }
    } catch (error) {
      console.error("JWT decode error:", error);
      return new Response(JSON.stringify({ error: "Unauthorized - Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body: VerifyPaymentRequest = await req.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      bookingId,
    } = body;

    console.log("Verify payment request:", {
      razorpay_order_id,
      razorpay_payment_id,
      bookingId,
      userId,
    });

    // Validate input - bookingId can be optional if payment is being verified without booking
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Missing required payment details" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get Razorpay secret for verification
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      console.error("Razorpay secret not configured");
      return new Response(
        JSON.stringify({ error: "Payment verification not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify signature using HMAC SHA256
    const expectedSignature = createHmac("sha256", razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValidSignature = expectedSignature === razorpay_signature;
    console.log("Signature verification:", isValidSignature);

    if (!isValidSignature) {

      if (bookingId) {
        const { error: bookingError } = await supabaseAdmin
          .from("bookings")
          .update({ status: "failed" })
          .eq("id", bookingId)
          .eq("user_id", userId);

        if (bookingError) {
          console.error("Failed to mark booking as failed:", bookingError);
        }
      }

      const { error: paymentError } = await supabaseAdmin
        .from("payments")
        .update({ status: "failed" })
        .eq("razorpay_order_id", razorpay_order_id)
        .eq("user_id", userId);
    }
    if (paymentError) {
      console.error("Failed to mark payment as failed:", paymentError);
    }

    return new Response(
      JSON.stringify({ success: false, error: "Payment verification failed" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
    console.log("Payment verified successfully");

    if (bookingId) {
      const { error: bookingUpdateError } = await supabaseAdmin
        .from("bookings")
        .update({
          status: "confirmed",
          razorpay_order_id,
          razorpay_payment_id,
        })
        .eq("id", bookingId)
        .eq("user_id", userId);

      if (bookingUpdateError) {
        console.error("Failed to update booking:", bookingUpdateError);
      }
      const { error: paymentUpdateError } = await supabaseAdmin
        .from("payments")
        .update({
          razorpay_payment_id,
          razorpay_signature,
          status: "completed",
          payment_date: new Date().toISOString(),
        })
        .eq("razorpay_order_id", razorpay_order_id)
        .eq("user_id", userId);

      if (paymentUpdateError) {
        console.error("Failed to update payment:", paymentUpdateError);
      }

      console.log("Booking and payment updated successfully");

      // Update payment record with payment details
      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment verified successfully",
          bookingId: bookingId ?? null,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Verification error:", error);

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
}});
