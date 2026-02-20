import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Plus, Trash2, Users } from 'lucide-react';

export function ShowManagement() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    movie_id: '',
    theater_name: '',
    location: '',
    show_date_time: '',
    show_price: '200',
  });

  const { data: shows, isLoading: showsLoading } = useQuery({
    queryKey: ['adminShows'],
    queryFn: async () => {
      const { data } = await supabase
        .from('shows')
        .select('*, movies(title)')
        .order('show_date_time', { ascending: false });
      return data || [];
    },
  });

  const { data: movies } = useQuery({
    queryKey: ['movies'],
    queryFn: async () => {
      const { data } = await supabase.from('movies').select('id, title');
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('shows').insert([
        {
          movie_id: data.movie_id,
          theater_name: data.theater_name,
          location: data.location,
          show_date_time: new Date(data.show_date_time).toISOString(),
          show_price: parseInt(data.show_price),
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminShows'] });
      setFormData({
        movie_id: '',
        theater_name: '',
        location: '',
        show_date_time: '',
        show_price: '200',
      });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shows').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminShows'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Add Show Form */}
      {showForm && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Add New Show</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={formData.movie_id}
                  onChange={(e) => setFormData({ ...formData, movie_id: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white rounded px-3 py-2"
                  required
                >
                  <option value="">Select Movie</option>
                  {movies?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Theater Name"
                  value={formData.theater_name}
                  onChange={(e) => setFormData({ ...formData, theater_name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
                <Input
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
                <Input
                  type="datetime-local"
                  value={formData.show_date_time}
                  onChange={(e) => setFormData({ ...formData, show_date_time: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
                <Input
                  type="number"
                  placeholder="Price (₹)"
                  value={formData.show_price}
                  onChange={(e) => setFormData({ ...formData, show_price: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Show'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowForm(false)}
                  variant="outline"
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Shows List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Shows ({shows?.length || 0})</CardTitle>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Show
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {showsLoading ? (
            <div className="text-slate-400">Loading shows...</div>
          ) : shows?.length === 0 ? (
            <div className="text-slate-400">No shows yet. Create one to get started!</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Movie</TableHead>
                    <TableHead className="text-slate-300">Theater</TableHead>
                    <TableHead className="text-slate-300">Location</TableHead>
                    <TableHead className="text-slate-300">Date & Time</TableHead>
                    <TableHead className="text-slate-300">Price</TableHead>
                    <TableHead className="text-slate-300">Seats</TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shows?.map((show) => (
                    <TableRow key={show.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-white font-medium">
                        {show.movies?.title || 'N/A'}
                      </TableCell>
                      <TableCell className="text-slate-300">{show.theater_name}</TableCell>
                      <TableCell className="text-slate-300">{show.location}</TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(show.show_date_time).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-slate-300">₹{show.show_price}</TableCell>
                      <TableCell className="text-slate-300">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{Object.keys(show.occupied_seats || {}).length}/{show.total_seats}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-red-600 border-red-600 hover:bg-red-700 text-white"
                          onClick={() => deleteMutation.mutate(show.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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