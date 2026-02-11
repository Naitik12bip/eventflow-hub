import { useRef } from 'react';
import { formatPrice } from '@/data/events';
import { Calendar, MapPin, Clock, Download, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { FormattedBooking } from '@/hooks/useBookings';

interface TicketModalProps {
  booking: FormattedBooking;
}

const generateQrUrl = (data: string, size = 200) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&bgcolor=1a1a2e&color=ffffff&format=png`;

const TicketModal = ({ booking }: TicketModalProps) => {
  const ticketRef = useRef<HTMLDivElement>(null);

  const qrData = JSON.stringify({
    bookingId: booking.id,
    event: booking.eventTitle,
    seats: booking.seats,
    amount: booking.totalAmount,
    status: booking.status,
  });

  const handleDownload = () => {
    if (!ticketRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket - ${booking.eventTitle}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f0f1a; color: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
          .ticket { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; max-width: 420px; width: 100%; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
          .ticket-header { padding: 24px 24px 16px; border-bottom: 2px dashed rgba(255,255,255,0.15); }
          .ticket-header h2 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
          .ticket-header .genre { font-size: 12px; color: #a0a0b8; text-transform: uppercase; letter-spacing: 1px; }
          .ticket-body { padding: 16px 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .ticket-body .field label { font-size: 11px; color: #a0a0b8; text-transform: uppercase; letter-spacing: 0.5px; }
          .ticket-body .field p { font-size: 14px; font-weight: 600; margin-top: 2px; }
          .ticket-qr { padding: 16px 24px 24px; display: flex; flex-direction: column; align-items: center; border-top: 2px dashed rgba(255,255,255,0.15); }
          .ticket-qr img { border-radius: 8px; }
          .ticket-qr .scan-text { font-size: 11px; color: #a0a0b8; margin-top: 8px; }
          .ticket-id { font-size: 10px; color: #666; text-align: center; padding: 8px; }
          @media print { body { background: white; } .ticket { border: 2px solid #333; } }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="ticket-header">
            <h2>${booking.eventTitle}</h2>
            <span class="genre">${booking.genre || booking.category}</span>
          </div>
          <div class="ticket-body">
            <div class="field">
              <label>Date</label>
              <p>${new Date(booking.eventDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <div class="field">
              <label>Time</label>
              <p>${booking.eventTime || 'TBA'}</p>
            </div>
            <div class="field">
              <label>Venue</label>
              <p>${booking.venue}</p>
            </div>
            <div class="field">
              <label>City</label>
              <p>${booking.city || '-'}</p>
            </div>
            <div class="field">
              <label>Seats</label>
              <p>${booking.seats.length > 0 ? booking.seats.join(', ') : `${booking.ticketCount} ticket(s)`}</p>
            </div>
            <div class="field">
              <label>Total Paid</label>
              <p>₹${booking.totalAmount}</p>
            </div>
          </div>
          <div class="ticket-qr">
            <img src="${generateQrUrl(qrData, 160)}" width="160" height="160" alt="QR Code" />
            <span class="scan-text">Scan at venue for entry</span>
          </div>
          <div class="ticket-id">Booking ID: ${booking.id.slice(0, 8).toUpperCase()}</div>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={booking.status !== 'confirmed'}
        >
          <QrCode className="w-4 h-4" />
          View Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Your Ticket</DialogTitle>
        </DialogHeader>

        <div ref={ticketRef} className="rounded-xl border border-border/50 overflow-hidden bg-muted/30">
          {/* Ticket Header */}
          <div className="p-5 border-b border-dashed border-border/50">
            <h3 className="font-display text-lg font-bold text-foreground">
              {booking.eventTitle}
            </h3>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {booking.genre || booking.category}
            </span>
          </div>

          {/* Ticket Details */}
          <div className="p-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Date</p>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(booking.eventDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
            {booking.eventTime && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Time</p>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  {booking.eventTime}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Venue</p>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {booking.venue}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Seats</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {booking.seats.length > 0
                  ? booking.seats.join(', ')
                  : `${booking.ticketCount} ticket(s)`}
              </p>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center p-5 border-t border-dashed border-border/50">
            <img
              src={generateQrUrl(qrData)}
              alt="Booking QR Code"
              className="rounded-lg"
              width={180}
              height={180}
            />
            <p className="text-xs text-muted-foreground mt-3">Scan at venue for entry</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              ID: {booking.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          {/* Amount */}
          <div className="p-4 bg-primary/10 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Paid</span>
            <span className="font-display text-lg font-bold text-primary">
              {formatPrice(booking.totalAmount)}
            </span>
          </div>
        </div>

        <Button onClick={handleDownload} className="w-full btn-primary gap-2 mt-2">
          <Download className="w-4 h-4" />
          Download / Print Ticket
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default TicketModal;