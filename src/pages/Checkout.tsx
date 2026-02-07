import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { formatPrice, formatDate } from '@/data/events';
import { useUser } from '@clerk/clerk-react';
import { useCreateBooking, useVerifyPayment } from '@/hooks/useBookings';
import { loadRazorpayScript, openRazorpayCheckout, RazorpayResponse } from '@/lib/razorpay';
import { z } from 'zod';
import {
  CreditCard,
  Lock,
  CheckCircle,
  Calendar,
  MapPin,
  Ticket,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Validation schema for checkout form
const checkoutSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  phone: z
    .string()
    .transform((val) => val.replace(/[\s-]/g, ''))
    .refine((val) => /^\+?[1-9]\d{9,14}$/.test(val), 'Please enter a valid phone number'),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface BookingData {
  event: {
    id: string;
    title: string;
    venue: string;
    city: string;
    date: string;
    time: string;
    image: string;
  };
  seats: Array<{
    id: string;
    price: number;
    seatId?: string;
  }>;
  total: number;
  showId?: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { user, isLoaded } = useUser();
  const createBooking = useCreateBooking();
  const verifyPayment = useVerifyPayment();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    const storedData = localStorage.getItem('pendingBooking');
    if (storedData) {
      setBookingData(JSON.parse(storedData));
    } else {
      navigate('/events');
    }
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = (): boolean => {
    try {
      checkoutSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handlePayment = async () => {
    // Client-side validation first
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    if (!bookingData) return;

    // Check if user is authenticated (Clerk)
    if (!isLoaded || !user) {
      toast.error('Please sign in to complete your booking');
      navigate('/auth');
      return;
    }

    setIsProcessing(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Please refresh and try again.');
        setIsProcessing(false);
        return;
      }

      // Get seat IDs and calculate price
      const seatIds = bookingData.seats.map((seat) => seat.id);
      const ticketPrice = bookingData.seats[0]?.price || 200;

      // Create booking via Supabase Edge Function
      const result = await createBooking.mutateAsync({
        eventId: bookingData.event.id,
        showId: bookingData.showId || bookingData.event.id,
        seatIds,
        ticketPrice,
      });

      console.log('Order created:', result);

      // Open Razorpay checkout modal
      openRazorpayCheckout(
        {
          orderId: result.orderId,
          amount: result.amount,
          currency: result.currency,
        },
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
        bookingData.event.title,
        async (response: RazorpayResponse) => {
          // Verify payment
          try {
            await verifyPayment.mutateAsync({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: result.bookingId,
            });

            setIsProcessing(false);
            setIsSuccess(true);
            localStorage.removeItem('pendingBooking');
            toast.success('Payment successful! Your tickets have been booked.');
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            toast.error('Payment verification failed. Please contact support.');
            setIsProcessing(false);
          }
        },
        () => {
          // On dismiss
          setIsProcessing(false);
          toast.info('Payment cancelled');
        }
      );
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('An error occurred during payment. Please try again.');
      setIsProcessing(false);
    }
  };

  if (!bookingData) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">
            No Booking Found
          </h1>
          <p className="text-muted-foreground mb-8">
            Please select an event and seats to proceed with booking.
          </p>
          <Button onClick={() => navigate('/events')}>Browse Events</Button>
        </div>
      </Layout>
    );
  }

  const subtotal = bookingData.total;
  const convenienceFee = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + convenienceFee;

  if (isSuccess) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-lg mx-auto text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-4">
              Booking Confirmed!
            </h1>
            <p className="text-muted-foreground mb-8">
              Your tickets have been booked successfully. You will receive a confirmation email shortly.
            </p>

            {/* Ticket Preview */}
            <div className="ticket glass-strong rounded-2xl p-6 mb-8 text-left">
              <div className="flex gap-4">
                <img
                  src={bookingData.event.image}
                  alt={bookingData.event.title}
                  className="w-24 h-24 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-display font-bold text-foreground">
                    {bookingData.event.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(bookingData.event.date)} • {bookingData.event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{bookingData.event.venue}, {bookingData.event.city}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-dashed border-border/50 flex justify-between items-center">
                <div>
                  <p className="text-muted-foreground text-sm">Seats</p>
                  <p className="font-semibold">{bookingData.seats.map((s) => s.id).join(', ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-sm">Total Paid</p>
                  <p className="font-display font-bold text-primary text-xl">
                    {formatPrice(totalAmount)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate('/events')}>
                Book More Events
              </Button>
              <Button className="btn-primary" onClick={() => navigate('/my-bookings')}>
                <Ticket className="w-4 h-4 mr-2" />
                View My Tickets
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Event
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-strong rounded-2xl p-6 md:p-8">
              <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                Contact Information
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className={`mt-1 h-12 bg-muted/50 border-border/50 ${errors.name ? 'border-destructive' : ''}`}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    className={`mt-1 h-12 bg-muted/50 border-border/50 ${errors.email ? 'border-destructive' : ''}`}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                    className={`mt-1 h-12 bg-muted/50 border-border/50 ${errors.phone ? 'border-destructive' : ''}`}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-strong rounded-2xl p-6 md:p-8">
              <h2 className="font-display text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-primary" />
                Payment
              </h2>

              <div className="bg-muted/30 rounded-xl p-4 border border-border/50 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Razorpay_logo.svg/120px-Razorpay_logo.svg.png"
                    alt="Razorpay"
                    className="h-6"
                  />
                  <span className="text-muted-foreground text-sm">Secure payments powered by Razorpay</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You will be redirected to Razorpay's secure payment gateway to complete your purchase.
                  All major credit/debit cards, UPI, net banking, and wallets are accepted.
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4 text-success" />
                <span>Your payment information is encrypted and secure</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 glass-strong rounded-2xl p-6 space-y-6">
              <h3 className="font-display text-xl font-bold text-foreground">
                Order Summary
              </h3>

              {/* Event Preview */}
              <div className="flex gap-4 pb-4 border-b border-border/50">
                <img
                  src={bookingData.event.image}
                  alt={bookingData.event.title}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground line-clamp-2">
                    {bookingData.event.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(bookingData.event.date)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {bookingData.event.venue}
                  </p>
                </div>
              </div>

              {/* Seats */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Seats</span>
                  <span className="text-foreground">
                    {bookingData.seats.map((s) => s.id).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Tickets ({bookingData.seats.length})
                  </span>
                  <span className="text-foreground">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Convenience Fee</span>
                  <span className="text-foreground">{formatPrice(convenienceFee)}</span>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-border/50">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-display text-2xl font-bold text-primary">
                  {formatPrice(totalAmount)}
                </span>
              </div>

              <Button
                className="w-full btn-primary h-14 text-lg"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <>
                    Pay {formatPrice(totalAmount)}
                    <Lock className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                By completing this purchase, you agree to our Terms of Service
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
