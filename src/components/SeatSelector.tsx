 import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/data/events';

interface Seat {
  id: string;
  row: string;
  number: number;
  type: 'standard' | 'premium' | 'vip';
  price: number;
  status: 'available' | 'selected' | 'reserved';
}

 interface SeatSelectorProps {
   onSeatsChange: (seats: Seat[]) => void;
   occupiedSeats?: string[];
   showPrice?: number;
 }
 
 const generateSeats = (occupiedSeats: string[] = [], showPrice?: number): Seat[] => {
  const seats: Seat[] = [];
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const seatsPerRow = 12;

  rows.forEach((row, rowIndex) => {
    for (let i = 1; i <= seatsPerRow; i++) {
       let type: Seat['type'] = 'standard';
       const basePrice = showPrice || 500;
       let price = basePrice;
       
       if (rowIndex < 2) {
         type = 'vip';
         price = basePrice * 4;
       } else if (rowIndex < 4) {
         type = 'premium';
         price = basePrice * 2;
       }
 
       // Check if seat is occupied from backend data
       const seatId = `${row}${i}`;
       const isReserved = occupiedSeats.includes(seatId);

      seats.push({
        id: `${row}${i}`,
        row,
        number: i,
        type,
        price,
        status: isReserved ? 'reserved' : 'available',
      });
    }
  });

  return seats;
};

 export const SeatSelector = ({ onSeatsChange, occupiedSeats = [], showPrice }: SeatSelectorProps) => {
   const [seats, setSeats] = useState<Seat[]>(() => generateSeats(occupiedSeats, showPrice));
   // Update seats when occupiedSeats or showPrice changes
   useEffect(() => {
     setSeats(generateSeats(occupiedSeats, showPrice));
     setSelectedSeats([]);
   }, [occupiedSeats, showPrice]);
 
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'reserved') return;

    setSeats((prev) =>
      prev.map((s) => {
        if (s.id === seat.id) {
          const newStatus = s.status === 'selected' ? 'available' : 'selected';
          return { ...s, status: newStatus };
        }
        return s;
      })
    );

    setSelectedSeats((prev) => {
      const exists = prev.find((s) => s.id === seat.id);
      let newSelection;
      if (exists) {
        newSelection = prev.filter((s) => s.id !== seat.id);
      } else {
        newSelection = [...prev, { ...seat, status: 'selected' as const }];
      }
      onSeatsChange(newSelection);
      return newSelection;
    });
  };

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  return (
    <div className="space-y-8">
      {/* Screen */}
      <div className="relative">
        <div className="w-full h-2 bg-gradient-primary rounded-full opacity-80" />
        <div className="absolute inset-x-0 -bottom-4 h-8 bg-gradient-to-b from-primary/20 to-transparent" />
        <p className="text-center text-muted-foreground text-sm mt-6">SCREEN</p>
      </div>

      {/* Seats Grid */}
      <div className="flex flex-col items-center gap-2 py-8">
        {rows.map((row) => (
          <div key={row} className="flex items-center gap-2">
            <span className="w-6 text-center text-muted-foreground font-medium">
              {row}
            </span>
            <div className="flex gap-1">
              {seats
                .filter((s) => s.row === row)
                .map((seat) => (
                  <button
                    key={seat.id}
                    onClick={() => handleSeatClick(seat)}
                    disabled={seat.status === 'reserved'}
                    className={cn(
                      'seat',
                      seat.status === 'available' && seat.type === 'standard' && 'seat-available',
                      seat.status === 'available' && seat.type === 'premium' && 'seat-available bg-secondary/30 hover:bg-secondary/60',
                      seat.status === 'available' && seat.type === 'vip' && 'seat-vip hover:opacity-80',
                      seat.status === 'selected' && 'seat-selected',
                      seat.status === 'reserved' && 'seat-reserved'
                    )}
                    title={`${seat.id} - ${formatPrice(seat.price)}`}
                  >
                    <span className="text-[10px] font-medium">{seat.number}</span>
                  </button>
                ))}
            </div>
            <span className="w-6 text-center text-muted-foreground font-medium">
              {row}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 text-sm">
         <div className="flex items-center gap-2">
           <div className="w-6 h-6 rounded-t-md bg-muted" />
           <span className="text-muted-foreground">Standard (₹{showPrice || 500})</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="w-6 h-6 rounded-t-md bg-secondary/50" />
           <span className="text-muted-foreground">Premium (₹{(showPrice || 500) * 2})</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="w-6 h-6 rounded-t-md seat-vip" />
           <span className="text-muted-foreground">VIP (₹{(showPrice || 500) * 4})</span>
         </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-t-md seat-selected" />
          <span className="text-muted-foreground">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-t-md seat-reserved" />
          <span className="text-muted-foreground">Reserved</span>
        </div>
      </div>

      {/* Selected Seats Summary */}
      {selectedSeats.length > 0 && (
        <div className="glass-strong rounded-xl p-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Selected Seats</p>
              <p className="font-display font-semibold text-foreground">
                {selectedSeats.map((s) => s.id).join(', ')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-sm">Total</p>
              <p className="font-display font-bold text-2xl text-primary">
                {formatPrice(selectedSeats.reduce((acc, s) => acc + s.price, 0))}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
