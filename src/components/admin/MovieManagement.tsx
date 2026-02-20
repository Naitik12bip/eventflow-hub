import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { z } from 'zod';

const movieSchema = z.object({
  title: z.string().min(1, 'Title required'),
  overview: z.string().optional(),
  poster_path: z.string().optional(),
  release_date: z.string().optional(),
  vote_average: z.number().optional(),
});

type MovieForm = z.infer<typeof movieSchema>;

export function MovieManagement() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<MovieForm>({
    title: '',
    overview: '',
    poster_path: '',
    release_date: '',
    vote_average: 0,
  });

  const { data: movies, isLoading } = useQuery({
    queryKey: ['adminMovies'],
    queryFn: async () => {
      const { data } = await supabase.from('movies').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MovieForm) => {
      const { error } = await supabase
        .from('movies')
        .insert([
          {
            id: `movie_${Date.now()}`,
            title: data.title,
            overview: data.overview || null,
            poster_path: data.poster_path || null,
            release_date: data.release_date || null,
            vote_average: data.vote_average || null,
          },
        ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMovies'] });
      setFormData({ title: '', overview: '', poster_path: '', release_date: '', vote_average: 0 });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('movies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMovies'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      movieSchema.parse(formData);
      createMutation.mutate(formData);
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Movie Form */}
      {showForm && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Add New Movie</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Movie Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Input
                  type="date"
                  value={formData.release_date || ''}
                  onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Input
                  placeholder="Poster URL"
                  value={formData.poster_path || ''}
                  onChange={(e) => setFormData({ ...formData, poster_path: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Input
                  type="number"
                  placeholder="Rating (0-10)"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.vote_average || ''}
                  onChange={(e) => setFormData({ ...formData, vote_average: parseFloat(e.target.value) })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <Textarea
                placeholder="Movie Overview"
                value={formData.overview || ''}
                onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Movie'}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ title: '', overview: '', poster_path: '', release_date: '', vote_average: 0 });
                  }}
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

      {/* Movies List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Movies ({movies?.length || 0})</CardTitle>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Movie
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-slate-400">Loading movies...</div>
          ) : movies?.length === 0 ? (
            <div className="text-slate-400">No movies yet. Add one to get started!</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Title</TableHead>
                    <TableHead className="text-slate-300">Release Date</TableHead>
                    <TableHead className="text-slate-300">Rating</TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movies?.map((movie) => (
                    <TableRow key={movie.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-white">{movie.title}</TableCell>
                      <TableCell className="text-slate-300">
                        {movie.release_date ? new Date(movie.release_date).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {movie.vote_average ? `${movie.vote_average}/10` : '-'}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-slate-700 border-slate-600 hover:bg-slate-600"
                          disabled
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-red-600 border-red-600 hover:bg-red-700 text-white"
                          onClick={() => deleteMutation.mutate(movie.id)}
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