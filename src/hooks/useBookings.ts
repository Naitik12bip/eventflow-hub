import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types for booking operations
interface CreateBookingRequest {
  eventId: string;
  showId: string;
  seatIds: string[];
  ticketPrice: number;
}

interface CreateBookingResponse {
  success: boolean;
  orderId: string;
  amount: number;
  currency: string;
  bookingId: string;
  keyId: string;
}

interface VerifyPaymentRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  bookingId: string;
}

export interface FormattedBooking {
  id: string;
  eventTitle: string;
  eventImage: string;
  venue: string;
  city: string;
  eventDate: string;
  eventTime: string;
  category: string;
  genre: string;
  duration: string;
  seats: string[];
  ticketCount: number;
  totalAmount: number;
  convenienceFee: number;
  status: string;
  paymentStatus: string;
  paymentId: string | null;
  bookingDate: string;
}

// Create a booking and get Razorpay order
export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBookingRequest): Promise<CreateBookingResponse> => {
      const { data: responseData, error } = await supabase.functions.invoke(
        'create-razorpay-order',
        { body: data }
      );

      if (error) {
        console.error('Create order error:', error);
        throw new Error(error.message || 'Failed to create order');
      }

      if (!responseData?.success) {
        throw new Error(responseData?.error || 'Failed to create order');
      }

      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occupiedSeats'] });
    },
  });
};

// Verify payment after Razorpay checkout
export const useVerifyPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: VerifyPaymentRequest) => {
      const { data: responseData, error } = await supabase.functions.invoke(
        'verify-razorpay-payment',
        { body: data }
      );

      if (error) {
        console.error('Verify payment error:', error);
        throw new Error(error.message || 'Payment verification failed');
      }

      if (!responseData?.success) {
        throw new Error(responseData?.error || 'Payment verification failed');
      }

      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
      queryClient.invalidateQueries({ queryKey: ['occupiedSeats'] });
    },
  });
};

// Fetch user's bookings from database via edge function
export const useUserBookings = () => {
  return useQuery({
    queryKey: ['userBookings'],
    queryFn: async (): Promise<FormattedBooking[]> => {
      const { data: responseData, error } = await supabase.functions.invoke(
        'get-user-bookings'
      );

      if (error) {
        console.error('Fetch bookings error:', error);
        throw new Error(error.message || 'Failed to fetch bookings');
      }

      if (!responseData?.success) {
        throw new Error(responseData?.error || 'Failed to fetch bookings');
      }

      return responseData.bookings;
    },
    staleTime: 2 * 60 * 1000,
  });
};