import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

const getEdgeFunctionToken = async (
  getToken: (options?: { template?: string }) => Promise<string | null>
): Promise<string | null> => {
  const defaultToken = await getToken();
  if (defaultToken) {
    return defaultToken;
  }

  return null;
};

// Types for booking operations
interface CreateBookingRequest {
  eventId: string;
  showId: string;
  seatIds: string[];
  ticketPrice: number;
}

interface CreateBookingResponse {
  orderId: string;
  amount: number;
  currency: string;
}

interface VerifyPaymentRequest {
  orderId: string;
  paymentId: string;
  signature: string;
  userId: string;
  showId: string;
  seatIds: string[];
}

interface VerifyPaymentResponse {
  message: string;
}

export interface FormattedBooking {
  id: string;
  userId: string;
  showId: string;
  seatIds: string[];
  amount: number;
  isPaid: boolean;
  createdAt: string;
  show: {
    _id: string;
    movie: {
      _id: string;
      title: string;
      poster_path: string;
    };
    showDateTime: string;
    showPrice: number;
  };
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

      const { data: response, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: data,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create order');
      }

      if (!response?.success) {
        throw new Error(response?.error || 'Failed to create order');
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
    },
  });
};

// Verify Razorpay payment
export const useVerifyPayment = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> => {
      const token = await getEdgeFunctionToken(getToken);
      if (!token) {
        throw new Error('Authentication required. Please sign in and try again.');
      }

      const { data: response, error } = await supabase.functions.invoke('verify-razorpay-payment', {
        body: data,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Payment verification failed');
      }

      if (!response?.success) {
        throw new Error(response?.error || 'Payment verification failed');
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
    },
  });
};

// Get user bookings
export const useUserBookings = () => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['userBookings'],
    queryFn: async (): Promise<FormattedBooking[]> => {
      const token = await getEdgeFunctionToken(getToken);
      if (!token) {
        throw new Error('Authentication required. Please sign in and try again.');
      }

      const { data: response, error } = await supabase.functions.invoke('get-user-bookings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch bookings');
      }

      if (!response?.success) {
        throw new Error(response?.error || 'Failed to fetch bookings');
      }

      return response.bookings;
    },
    enabled: !!getToken,
  });
};