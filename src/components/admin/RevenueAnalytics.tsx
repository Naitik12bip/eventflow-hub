import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, CreditCard, AlertCircle } from 'lucide-react';

export function RevenueAnalytics() {
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['adminRevenue'],
    queryFn: async () => {
      // Fetch all payments with booking and show data
      const { data: payments } = await supabase
        .from('payments')
        .select('*, bookings(*, shows(*, movies(title)))')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (!payments) return null;

      // Calculate metrics
      const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
      const totalPayments = payments.length;
      const averageOrderValue = totalPayments > 0 ? totalRevenue / totalPayments : 0;

      // Group by movie for top performers
      const movieRevenue: Record<string, number> = {};
      const moviePayments: Record<string, number> = {};

      payments.forEach((p) => {
        const movieTitle = p.bookings?.shows?.movies?.title || 'Unknown';
        movieRevenue[movieTitle] = (movieRevenue[movieTitle] || 0) + p.amount;
        moviePayments[movieTitle] = (moviePayments[movieTitle] || 0) + 1;
      });

      const topMovies = Object.entries(movieRevenue)
        .map(([title, revenue]) => ({
          title,
          revenue,
          bookings: moviePayments[title] || 0,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Daily revenue
      const dailyRevenue: Record<string, number> = {};
      payments.forEach((p) => {
        const date = new Date(p.created_at).toLocaleDateString();
        dailyRevenue[date] = (dailyRevenue[date] || 0) + p.amount;
      });

      const last7Days = Object.entries(dailyRevenue)
        .slice(-7)
        .map(([date, revenue]) => ({ date, revenue }));

      return {
        totalRevenue,
        totalPayments,
        averageOrderValue,
        topMovies,
        dailyRevenue: last7Days,
      };
    },
  });

  if (isLoading) {
    return <div className="text-slate-400">Loading revenue data...</div>;
  }

  if (!revenueData) {
    return <div className="text-slate-400">No revenue data available.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-slate-300">
              Total Revenue
            </CardTitle>
            <DollarSign className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ₹{revenueData.totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-slate-300">
              Total Payments
            </CardTitle>
            <CreditCard className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {revenueData.totalPayments}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-slate-300">
              Average Order Value
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ₹{revenueData.averageOrderValue.toFixed(0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Movies */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Top Performing Movies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revenueData.topMovies.length === 0 ? (
            <div className="text-slate-400">No movie revenue data available.</div>
          ) : (
            <div className="space-y-4">
              {revenueData.topMovies.map((movie, idx) => (
                <div key={movie.title} className="flex items-center justify-between p-3 bg-slate-700 rounded">
                  <div>
                    <div className="text-white font-medium">
                      #{idx + 1} - {movie.title}
                    </div>
                    <div className="text-sm text-slate-400">
                      {movie.bookings} bookings
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">
                      ₹{movie.revenue.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400">
                      {((movie.revenue / revenueData.totalRevenue) * 100).toFixed(1)}% of total
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Revenue */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Revenue Last 7 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revenueData.dailyRevenue.length === 0 ? (
            <div className="text-slate-400">No daily revenue data available.</div>
          ) : (
            <div className="space-y-3">
              {revenueData.dailyRevenue.map((day) => {
                const maxRevenue = Math.max(
                  ...revenueData.dailyRevenue.map((d) => d.revenue)
                );
                const percentage = (day.revenue / maxRevenue) * 100;

                return (
                  <div key={day.date}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{day.date}</span>
                      <span className="text-white font-medium">
                        ₹{day.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Info */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-400">
            <AlertCircle className="w-5 h-5" />
            Payment Integration Info
          </CardTitle>
        </CardHeader>
        <CardContent className="text-slate-300 space-y-2 text-sm">
          <p>
            • All revenue is processed through <strong>Razorpay</strong> in test mode
          </p>
          <p>
            • Revenue data reflects completed payments with status "completed"
          </p>
          <p>
            • Each payment is tied to a booking for tracking and reconciliation
          </p>
          <p>
            • Refunds can be processed through Razorpay dashboard
          </p>
        </CardContent>
      </Card>
    </div>
  );
}