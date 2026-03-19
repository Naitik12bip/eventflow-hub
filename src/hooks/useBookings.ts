import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { getTMDBImageUrl } from '@/lib/api';

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
  success: boolean;
  orderId: string;
  amount: number;
  currency: string;
  bookingId: string | null;
  keyId: string;
  warning?: string;
}

interface VerifyPaymentRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  bookingId: string | null;
}

interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  bookingId?: string | null;
}

interface UserBookingsApiResponseItem {
  id: string;
  movieTitle?: string;
  moviePoster?: string;
  movieOverview?: string;
  theater?: string;
  location?: string;
  showDateTime?: string;
  selectedSeats?: string[];
  totalAmount?: number;
  convenienceFee?: number;
  totalPrice?: number;
  status?: string;
  paymentStatus?: string;
  razorpayPaymentId?: string | null;
  createdAt?: string;
  eventTitle?: string;
  eventImage?: string;
  eventDescription?: string;
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  city?: string;
  seats?: string[];
  ticketCount?: number;
  category?: string;
  genre?: string;
}

export interface FormattedBooking {
  id: string;
  eventTitle: string;
  eventImage: string;
  eventDescription: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  city: string;
  seats: string[];
  ticketCount: number;
  totalAmount: number;
  convenienceFee: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  razorpayPaymentId: string | null;
  category: string;
  genre: string;
  createdAt: string;
}

const normalizeBooking = (booking: UserBookingsApiResponseItem): FormattedBooking => {
  const seatList = booking.seats ?? booking.selectedSeats ?? [];
  const rawTotalAmount = booking.totalAmount ?? 0;
  const convenienceFee = booking.convenienceFee ?? 0;
  const totalPrice = booking.totalPrice ?? rawTotalAmount;
  const totalAmount = totalPrice;
  const showDate = booking.showDateTime ? new Date(booking.showDateTime) : null;
  const poster = booking.eventImage ?? booking.moviePoster ?? '/placeholder.svg';

  return {
    id: booking.id,
    eventTitle: booking.eventTitle ?? booking.movieTitle ?? 'Untitled event',
    eventImage: poster.startsWith('http') || poster.startsWith('/') ? poster : getTMDBImageUrl(poster),
    eventDescription: booking.eventDescription ?? booking.movieOverview ?? '',
    eventDate: booking.eventDate ?? showDate?.toISOString() ?? '',
    eventTime:
      booking.eventTime ??
      (showDate
        ? showDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : ''),
    venue: booking.venue ?? booking.theater ?? 'Venue TBA',
    city: booking.city ?? booking.location ?? '',
    seats: seatList,
    ticketCount: booking.ticketCount ?? seatList.length,
    totalAmount,
    convenienceFee,
    totalPrice,
    status: booking.status ?? 'pending',
    paymentStatus: booking.paymentStatus ?? 'unknown',
    razorpayPaymentId: booking.razorpayPaymentId ?? null,
    category: booking.category ?? 'movies',
    genre: booking.genre ?? 'Movie',
    createdAt: booking.createdAt ?? new Date().toISOString(),
  };
};

// Create a booking and get Razorpay order
export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  const { getToken, isLoaded, userId } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateBookingRequest): Promise<CreateBookingResponse> => {
      if (!isLoaded || !userId) {
        throw new Error('Authentication required. Please sign in and try again.');
      }
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
  const { getToken, isLoaded, userId } = useAuth();

  return useMutation({
    mutationFn: async (data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> => {
      if (!isLoaded || !userId) {
        throw new Error('Authentication required. Please sign in and try again.');
      }
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
      queryClient.invalidateQueries({ queryKey: ['shows'] });
      queryClient.invalidateQueries({ queryKey: ['movieDetails'] });
      queryClient.invalidateQueries({ queryKey: ['occupiedSeats'] });
    },
  });
};

// Get user bookings
export const useUserBookings = () => {
  const { getToken, isLoaded, userId } = useAuth();

  return useQuery({
    queryKey: ['userBookings',userId],
    queryFn: async (): Promise<FormattedBooking[]> => {
      if (!isLoaded || !userId) {
        throw new Error('Authentication required. Please sign in and try again.');
      }
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

      return ((response.bookings ?? []) as UserBookingsApiResponseItem[]).map(normalizeBooking);
      
    },
    enabled: isLoaded && !!userId,
  });
};