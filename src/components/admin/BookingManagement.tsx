import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

export function BookingManagement() {
  const [searchUser, setSearchUser] = useState('');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['adminBookings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*, shows(theater_name, show_date_time, movies(title))')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const filteredBookings = bookings?.filter(
    (booking) =>
      booking.user_id?.toLowerCase().includes(searchUser.toLowerCase()) ||
      booking.shows?.theater_name?.toLowerCase().includes(searchUser.toLowerCase()) ||
      booking.shows?.movies?.title?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 text-green-500';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'failed':
        return 'bg-red-500/10 text-red-500';
      case 'cancelled':
        return 'bg-gray-500/10 text-gray-500';
      default:
        return 'bg-slate-500/10 text-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by user ID, movie, or theater..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle>Bookings ({filteredBookings?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-slate-400">Loading bookings...</div>
          ) : filteredBookings?.length === 0 ? (
            <div className="text-slate-400">No bookings found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Booking ID</TableHead>
                    <TableHead className="text-slate-300">User</TableHead>
                    <TableHead className="text-slate-300">Movie</TableHead>
                    <TableHead className="text-slate-300">Theater</TableHead>
                    <TableHead className="text-slate-300">Date & Time</TableHead>
                    <TableHead className="text-slate-300">Seats</TableHead>
                    <TableHead className="text-slate-300">Amount</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Booked On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings?.map((booking) => (
                    <TableRow key={booking.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-white font-mono text-xs">
                        {booking.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-slate-300 font-mono text-xs">
                        {booking.user_id?.slice(0, 10)}...
                      </TableCell>
                      <TableCell className="text-white">
                        {booking.shows?.movies?.title || 'N/A'}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {booking.shows?.theater_name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {booking.shows?.show_date_time
                          ? new Date(booking.shows.show_date_time).toLocaleString()
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {booking.selected_seats?.length || 0} seats
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        ₹{booking.total_amount + booking.convenience_fee}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}