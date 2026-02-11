import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';


const CLERK_SUPABASE_TEMPLATE = import.meta.env.VITE_CLERK_SUPABASE_JWT_TEMPLATE;

const getEdgeFunctionToken = async (
  getToken: (options?: { template?: string }) => Promise<string | null>
): Promise<string | null> => {
  const defaultToken = await getToken();
  if (defaultToken) {
    return defaultToken;
  }

  if (!CLERK_SUPABASE_TEMPLATE) {
    return null;
  }

  try {
    return await getToken({ template: CLERK_SUPABASE_TEMPLATE });
  } catch (error) {
    console.warn(
      `Failed to fetch Clerk token using template "${CLERK_SUPABASE_TEMPLATE}".`,
      error
    );
    return null;
  }
};


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
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateBookingRequest): Promise<CreateBookingResponse> => {
      const token = await getEdgeFunctionToken(getToken);
      if (!token) {
        throw new Error('Authentication required. Please sign in and try again.');
      }

      const { data: responseData, error } = await supabase.functions.invoke(
        'create-razorpay-order',
        {
          body: data,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (data: VerifyPaymentRequest) => {
      const token = await getEdgeFunctionToken(getToken);
      if (!token) {
        throw new Error('Authentication required. Please sign in and try again.');
      }
      const { data: responseData, error } = await supabase.functions.invoke(
        'verify-razorpay-payment',
        {
          body: data,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['userBookings'],
    queryFn: async (): Promise<FormattedBooking[]> => {
      const token = await getEdgeFunctionToken(getToken);
      if (!token) {
        throw new Error('Authentication required. Please sign in to view bookings.');
      }

      const { data: responseData, error } = await supabase.functions.invoke(
        'get-user-bookings',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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