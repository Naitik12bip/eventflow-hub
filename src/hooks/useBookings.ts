import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import  api  from '@/lib/api';

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

      const response = await api.post('/payment/create-razorpay-order', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to create order');
      }

      return response.data;
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

      const response = await api.post('/payment/verify-razorpay-payment', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Payment verification failed');
      }

      return response.data;
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

      const response = await api.post('/user/get-user-bookings', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to fetch bookings');
      }

      return response.data.bookings;
    },
    enabled: !!getToken,
  });
};