 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 interface BookingRequest {
   name: string;
   email: string;
   phone: string;
   eventId: string;
   seatIds: string[];
 }
 
 // Validation functions
 function validateName(name: string): { valid: boolean; error?: string } {
   if (!name || typeof name !== 'string') {
     return { valid: false, error: 'Name is required' };
   }
   const trimmed = name.trim();
   if (trimmed.length < 2) {
     return { valid: false, error: 'Name must be at least 2 characters' };
   }
   if (trimmed.length > 100) {
     return { valid: false, error: 'Name must be less than 100 characters' };
   }
   // Only allow letters, spaces, hyphens, and apostrophes
   if (!/^[a-zA-Z\s-']+$/.test(trimmed)) {
     return { valid: false, error: 'Name contains invalid characters' };
   }
   return { valid: true };
 }
 
 function validateEmail(email: string): { valid: boolean; error?: string } {
   if (!email || typeof email !== 'string') {
     return { valid: false, error: 'Email is required' };
   }
   const trimmed = email.trim().toLowerCase();
   if (trimmed.length > 255) {
     return { valid: false, error: 'Email must be less than 255 characters' };
   }
   // RFC 5322 compliant email regex
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if (!emailRegex.test(trimmed)) {
     return { valid: false, error: 'Invalid email address' };
   }
   return { valid: true };
 }
 
 function validatePhone(phone: string): { valid: boolean; error?: string } {
   if (!phone || typeof phone !== 'string') {
     return { valid: false, error: 'Phone number is required' };
   }
   // Remove spaces and dashes for validation
   const cleaned = phone.replace(/[\s-]/g, '');
   // International format: optional + followed by 10-15 digits
   if (!/^\+?[1-9]\d{9,14}$/.test(cleaned)) {
     return { valid: false, error: 'Invalid phone number format' };
   }
   return { valid: true };
 }
 
 function validateUUID(id: string, fieldName: string): { valid: boolean; error?: string } {
   if (!id || typeof id !== 'string') {
     return { valid: false, error: `${fieldName} is required` };
   }
   const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
   if (!uuidRegex.test(id)) {
     return { valid: false, error: `Invalid ${fieldName} format` };
   }
   return { valid: true };
 }
 
 Deno.serve(async (req) => {
   // Handle CORS preflight requests
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
 
   try {
     // Get authorization header
     const authHeader = req.headers.get('Authorization');
     if (!authHeader?.startsWith('Bearer ')) {
       console.error('Missing or invalid authorization header');
       return new Response(
         JSON.stringify({ error: 'Authentication required' }),
         { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }

     // Decode Clerk JWT to get user ID
     const token = authHeader.replace('Bearer ', '');
     let userId: string;
     try {
       const payloadBase64 = token.split('.')[1];
       const payload = JSON.parse(atob(payloadBase64));
       userId = payload.sub;
       if (!userId) throw new Error('No sub claim in token');
     } catch (e) {
       console.error('JWT decode error:', e);
       return new Response(
         JSON.stringify({ error: 'Invalid authentication' }),
         { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }

     console.log('Processing booking for user:', userId);

     // Create Supabase client with service role for database operations
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
     
     // Validate all inputs
     const nameValidation = validateName(body.name);
     if (!nameValidation.valid) {
       return new Response(
         JSON.stringify({ error: nameValidation.error }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     const emailValidation = validateEmail(body.email);
     if (!emailValidation.valid) {
       return new Response(
         JSON.stringify({ error: emailValidation.error }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     const phoneValidation = validatePhone(body.phone);
     if (!phoneValidation.valid) {
       return new Response(
         JSON.stringify({ error: phoneValidation.error }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     const eventIdValidation = validateUUID(body.eventId, 'Event ID');
     if (!eventIdValidation.valid) {
       return new Response(
         JSON.stringify({ error: eventIdValidation.error }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     if (!Array.isArray(body.seatIds) || body.seatIds.length === 0) {
       return new Response(
         JSON.stringify({ error: 'At least one seat must be selected' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     if (body.seatIds.length > 10) {
       return new Response(
         JSON.stringify({ error: 'Maximum 10 seats per booking' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     for (const seatId of body.seatIds) {
       const seatValidation = validateUUID(seatId, 'Seat ID');
       if (!seatValidation.valid) {
         return new Response(
           JSON.stringify({ error: seatValidation.error }),
           { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
         );
       }
     }
 
     // Use service role client for database operations
     const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
     const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
 
     // Verify event exists and is public
     const { data: event, error: eventError } = await adminSupabase
       .from('events')
       .select('id, title, is_public, event_date')
       .eq('id', body.eventId)
       .single();
 
     if (eventError || !event) {
       console.error('Event not found:', eventError);
       return new Response(
         JSON.stringify({ error: 'Event not found' }),
         { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     if (!event.is_public) {
       return new Response(
         JSON.stringify({ error: 'Event is not available for booking' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     // Verify seats exist, belong to the event, and are not already booked
     const { data: seats, error: seatsError } = await adminSupabase
       .from('seats')
       .select('id, price, is_booked, event_id')
       .in('id', body.seatIds);
 
     if (seatsError || !seats || seats.length !== body.seatIds.length) {
       console.error('Seats error:', seatsError);
       return new Response(
         JSON.stringify({ error: 'One or more seats not found' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     // Verify all seats belong to the event and are not booked
     for (const seat of seats) {
       if (seat.event_id !== body.eventId) {
         return new Response(
           JSON.stringify({ error: 'Seat does not belong to this event' }),
           { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
         );
       }
       if (seat.is_booked) {
         return new Response(
           JSON.stringify({ error: 'One or more seats are already booked' }),
           { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
         );
       }
     }
 
     // Calculate total from server-side seat prices (never trust client prices)
     const subtotal = seats.reduce((sum, seat) => sum + seat.price, 0);
     const convenienceFee = Math.round(subtotal * 0.05);
     const totalAmount = subtotal + convenienceFee;
 
     console.log('Creating booking with total:', totalAmount);
 
     // Create booking
     const { data: booking, error: bookingError } = await adminSupabase
       .from('bookings')
       .insert({
         user_id: userId,
         event_id: body.eventId,
         total_amount: totalAmount,
         convenience_fee: convenienceFee,
         status: 'confirmed'
       })
       .select()
       .single();
 
     if (bookingError || !booking) {
       console.error('Booking error:', bookingError);
       return new Response(
         JSON.stringify({ error: 'Failed to create booking' }),
         { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     // Mark seats as booked
     const { error: updateSeatsError } = await adminSupabase
       .from('seats')
       .update({
         is_booked: true,
         booked_by_user: userId,
         booked_at: new Date().toISOString()
       })
       .in('id', body.seatIds);
 
     if (updateSeatsError) {
       console.error('Update seats error:', updateSeatsError);
       // Rollback booking if seats update fails
       await adminSupabase.from('bookings').delete().eq('id', booking.id);
       return new Response(
         JSON.stringify({ error: 'Failed to reserve seats' }),
         { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     // Create tickets for each seat
     const tickets = seats.map(seat => ({
       booking_id: booking.id,
       event_id: body.eventId,
       seat_id: seat.id,
       user_id: userId,
       price: seat.price,
       qr_code: `TKT-${booking.id.slice(0, 8)}-${seat.id.slice(0, 8)}`
     }));
 
     const { error: ticketsError } = await adminSupabase
       .from('tickets')
       .insert(tickets);
 
     if (ticketsError) {
       console.error('Tickets error:', ticketsError);
       // Note: In production, you'd want proper transaction handling
     }
 
     // Create payment record
     const { error: paymentError } = await adminSupabase
       .from('payments')
       .insert({
         booking_id: booking.id,
         user_id: userId,
         amount: totalAmount,
         status: 'completed',
         payment_date: new Date().toISOString()
       });
 
     if (paymentError) {
       console.error('Payment error:', paymentError);
     }
 
     // Update user profile with contact info
     await adminSupabase
       .from('profiles')
       .update({
         name: body.name.trim(),
         email: body.email.trim().toLowerCase(),
         phone: body.phone.replace(/[\s-]/g, '')
       })
       .eq('user_id', userId);
 
     console.log('Booking completed successfully:', booking.id);
 
     return new Response(
       JSON.stringify({
         success: true,
         bookingId: booking.id,
         totalAmount,
         message: 'Booking confirmed successfully'
       }),
       { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
 
   } catch (error) {
     console.error('Unexpected error:', error);
     return new Response(
       JSON.stringify({ error: 'An unexpected error occurred' }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });