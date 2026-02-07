import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { dummyBookingData, dummyShowsData } from '@/data/dummyData';

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
  movieTitle: string;
  posterUrl: string;
  showDateTime: Date;
  formattedDate: string;
  formattedTime: string;
  seats: string[];
  totalAmount: number;
  status: string;
  createdAt: Date;
}

// Create a booking and get Razorpay order
export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBookingRequest): Promise<CreateBookingResponse> => {
      const { data: responseData, error } = await supabase.functions.invoke(
        'create-razorpay-order',
        {
          body: data,
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

  return useMutation({
    mutationFn: async (data: VerifyPaymentRequest) => {
      const { data: responseData, error } = await supabase.functions.invoke(
        'verify-razorpay-payment',
        {
          body: data,
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

// Fetch user's bookings (using dummy data for now)
export const useUserBookings = () => {
  return useQuery({
    queryKey: ['userBookings'],
    queryFn: async (): Promise<FormattedBooking[]> => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Return formatted dummy bookings
      return dummyBookingData.map((booking, index) => {
        const showDateTime = new Date(booking.show.showDateTime);
        const movie = dummyShowsData.find((m) => m._id === booking.show.movie._id) || dummyShowsData[0];

        return {
          id: booking._id + '_' + index,
          movieTitle: movie.title,
          posterUrl: movie.poster_path,
          showDateTime,
          formattedDate: showDateTime.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          formattedTime: showDateTime.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          seats: booking.bookedSeats,
          totalAmount: booking.amount,
          status: booking.isPaid ? 'confirmed' : 'pending',
          createdAt: new Date(),
        };
      });
    },
    staleTime: 2 * 60 * 1000,
  });
};
