 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import api from '@/lib/api';
 import { getTMDBImageUrl } from '@/lib/api';
 
 // Types for booking operations
 interface CreateBookingRequest {
   showId: string;
   seats: string[];
 }
 
 interface CreateBookingResponse {
   booking: {
     _id: string;
     status: string;
   };
   razorpayOrder: {
     id: string;
     amount: number;
     currency: string;
   };
 }
 
 interface VerifyPaymentRequest {
   razorpay_payment_id: string;
   razorpay_order_id: string;
   razorpay_signature: string;
   bookingId: string;
 }
 
 interface UserBooking {
   _id: string;
   showId: string;
   seats: string[];
   totalAmount: number;
   status: string;
   createdAt: string;
   show: {
     showDateTime: string;
     showPrice: number;
     movie: {
       title: string;
       poster_path: string | null;
     };
   };
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
 
 // Create a booking
 export const useCreateBooking = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: async (data: CreateBookingRequest): Promise<CreateBookingResponse> => {
       const response = await api.post<CreateBookingResponse>('/booking/create', data);
       return response.data;
     },
     onSuccess: () => {
       // Invalidate seats query to refresh availability
       queryClient.invalidateQueries({ queryKey: ['occupiedSeats'] });
     },
   });
 };
 
 // Verify payment after Razorpay checkout
 export const useVerifyPayment = () => {
   const queryClient = useQueryClient();
   
   return useMutation({
     mutationFn: async (data: VerifyPaymentRequest) => {
       const response = await api.post('/payment/verify-payment', data);
       return response.data;
     },
     onSuccess: () => {
       // Invalidate bookings to show updated status
       queryClient.invalidateQueries({ queryKey: ['userBookings'] });
       queryClient.invalidateQueries({ queryKey: ['occupiedSeats'] });
     },
   });
 };
 
 // Fetch user's bookings
 export const useUserBookings = () => {
   return useQuery({
     queryKey: ['userBookings'],
     queryFn: async (): Promise<FormattedBooking[]> => {
       const response = await api.get<UserBooking[]>('/user/bookings');
       
       return response.data.map(booking => {
         const showDateTime = new Date(booking.show.showDateTime);
         
         return {
           id: booking._id,
           movieTitle: booking.show.movie.title,
           posterUrl: getTMDBImageUrl(booking.show.movie.poster_path),
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
           seats: booking.seats,
           totalAmount: booking.totalAmount,
           status: booking.status,
           createdAt: new Date(booking.createdAt),
         };
       });
     },
     staleTime: 2 * 60 * 1000, // 2 minutes
   });
 };