import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart3,
  Film,
  Calendar,
  Users,
  DollarSign,
  Ticket,
  AlertCircle,
} from 'lucide-react';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { MovieManagement } from '@/components/admin/MovieManagement';
import { ShowManagement } from '@/components/admin/ShowManagement';
import { BookingManagement } from '@/components/admin/BookingManagement';
import { RevenueAnalytics } from '@/components/admin/RevenueAnalytics';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-slate-400">Manage movies, shows, bookings, and view analytics</p>
          </div>

          {/* Admin Notice */}
          <Alert className="mb-6 border-amber-500 bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-200">
              This admin panel is restricted to administrators only. Unauthorized access attempts are logged.
            </AlertDescription>
          </Alert>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-slate-900 border border-slate-700">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="movies" className="flex items-center gap-2">
                <Film className="w-4 h-4" />
                <span className="hidden sm:inline">Movies</span>
              </TabsTrigger>
              <TabsTrigger value="shows" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Shows</span>
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                <span className="hidden sm:inline">Bookings</span>
              </TabsTrigger>
              <TabsTrigger value="revenue" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Revenue</span>
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="mt-6">
              <AdminDashboard />
            </TabsContent>

            {/* Movies Tab */}
            <TabsContent value="movies" className="mt-6">
              <MovieManagement />
            </TabsContent>

            {/* Shows Tab */}
            <TabsContent value="shows" className="mt-6">
              <ShowManagement />
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="mt-6">
              <BookingManagement />
            </TabsContent>

            {/* Revenue Tab */}
            <TabsContent value="revenue" className="mt-6">
              <RevenueAnalytics />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}