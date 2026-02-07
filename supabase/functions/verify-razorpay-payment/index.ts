import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

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
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate user
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error("Auth error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);

    // Parse request body
    const body: VerifyPaymentRequest = await req.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, bookingId } = body;

    console.log("Verify payment request:", { razorpay_order_id, razorpay_payment_id, bookingId });

    // Validate input
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !bookingId) {
      return new Response(
        JSON.stringify({ error: "Missing required payment details" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Razorpay secret for verification
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      console.error("Razorpay secret not configured");
      return new Response(
        JSON.stringify({ error: "Payment verification not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify signature using HMAC SHA256
    const expectedSignature = createHmac("sha256", razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValidSignature = expectedSignature === razorpay_signature;
    console.log("Signature verification:", isValidSignature);

    // Use service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (!isValidSignature) {
      console.error("Invalid payment signature");

      // Update booking status to failed
      await supabaseAdmin
        .from("bookings")
        .update({ status: "failed" })
        .eq("id", bookingId);

      // Update payment status to failed
      await supabaseAdmin
        .from("payments")
        .update({ status: "failed" })
        .eq("razorpay_order_id", razorpay_order_id);

      return new Response(
        JSON.stringify({ success: false, error: "Payment verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Payment verified successfully!
    console.log("Payment verified successfully");

    // Update booking status to confirmed
    const { error: bookingUpdateError } = await supabaseAdmin
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId);

    if (bookingUpdateError) {
      console.error("Failed to update booking:", bookingUpdateError);
    }

    // Update payment record with payment details
    const { error: paymentUpdateError } = await supabaseAdmin
      .from("payments")
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: "completed",
        payment_date: new Date().toISOString(),
      })
      .eq("razorpay_order_id", razorpay_order_id);

    if (paymentUpdateError) {
      console.error("Failed to update payment:", paymentUpdateError);
    }

    console.log("Booking and payment updated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified successfully",
        bookingId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in verify-razorpay-payment:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
