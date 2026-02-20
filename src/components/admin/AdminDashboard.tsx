import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Film, Calendar, DollarSign, Ticket, TrendingUp } from 'lucide-react';

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const [
        moviesCount,
        showsCount,
        bookingsCount,
        usersCount,
        paymentsData,
      ] = await Promise.all([
        supabase.from('movies').select('id', { count: 'exact', head: true }),
        supabase.from('shows').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase
          .from('payments')
          .select('amount, status')
          .eq('status', 'completed'),
      ]);

      const totalRevenue = paymentsData.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const completedPayments = paymentsData.data?.length || 0;

      return {
        movies: moviesCount.count || 0,
        shows: showsCount.count || 0,
        bookings: bookingsCount.count || 0,
        users: usersCount.count || 0,
        revenue: totalRevenue,
        completedPayments,
      };
    },
  });

  const statCards = [
    {
      title: 'Total Movies',
      value: stats?.movies || 0,
      icon: Film,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Shows',
      value: stats?.shows || 0,
      icon: Calendar,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Total Bookings',
      value: stats?.bookings || 0,
      icon: Ticket,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Total Users',
      value: stats?.users || 0,
      icon: Users,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Total Revenue',
      value: `₹${(stats?.revenue || 0).toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Completed Payments',
      value: stats?.completedPayments || 0,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-300">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24 bg-slate-700" />
              ) : (
                <div className="text-2xl font-bold text-white">{card.value}</div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}