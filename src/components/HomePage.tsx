import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, History, Layout, ArrowRight, Settings, Trash2, Calendar } from 'lucide-react';
import { supabase, type Wall } from '../lib/supabase';

const SAMPLE_WALLS: Wall[] = [
  {
    id: 'sample-1',
    created_at: new Date().toISOString(),
    name: 'Annual Excellence Summit 2024',
    slug: 'main-2024',
    description: 'The primary gratitude wall for the main event.',
    is_active: true
  },
  {
    id: 'sample-2',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    name: 'Leadership Retreat 2023',
    slug: 'leadership-2023',
    description: 'Gratitude shared during the winter leadership retreat.',
    is_active: false
  }
];

export default function HomePage() {
  const navigate = useNavigate();
  const [walls, setWalls] = useState<Wall[]>(SAMPLE_WALLS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newWall, setNewWall] = useState({ name: '', description: '' });
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);

  useEffect(() => {
    const url = (import.meta as any).env.VITE_SUPABASE_URL;
    const key = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
    
    if (url && key && url !== 'your_supabase_project_url') {
      setIsSupabaseConfigured(true);
      fetchWalls();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchWalls = async () => {
    try {
      const { data, error } = await supabase
        .from('walls')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        setWalls(data);
      }
    } catch (err) {
      console.error('Error fetching walls:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWall = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = newWall.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    if (!isSupabaseConfigured) {
      const wall: Wall = {
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        name: newWall.name,
        description: newWall.description,
        slug,
        is_active: true
      };
      setWalls([wall, ...walls]);
      setIsCreateModalOpen(false);
      setNewWall({ name: '', description: '' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('walls')
        .insert([{ ...newWall, slug }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setWalls([data, ...walls]);
        setIsCreateModalOpen(false);
        setNewWall({ name: '', description: '' });
        navigate(`/admin/wall/${data.slug}`);
      }
    } catch (err) {
      console.error('Error creating wall:', err);
      alert('Failed to create wall. Slug might already exist.');
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text-main p-6 md:p-12">
      <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-accent font-black">Admin Dashboard</span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mt-2">Wall Control Center</h1>
          <p className="text-text-dim mt-2 max-w-xl">Manage your gratitude walls, create new event spaces, and view historical archives.</p>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/demo')}
            className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all flex items-center gap-3 border border-white/10"
          >
            <Layout size={20} /> View Demo
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-accent hover:bg-amber-600 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all flex items-center gap-3 shadow-lg shadow-accent/20"
          >
            <Plus size={20} /> Create New Wall
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {!isSupabaseConfigured && (
          <div className="mb-12 p-4 bg-accent/10 border border-accent/20 rounded-xl text-accent text-xs font-bold uppercase tracking-widest text-center">
            Demo Mode: Walls created here will not persist across refreshes.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Active Walls Section */}
          <div className="lg:col-span-3 flex items-center gap-4 mb-2">
            <Layout size={20} className="text-accent" />
            <h2 className="text-xl font-black uppercase tracking-tight">Active Walls</h2>
            <div className="h-px flex-1 bg-white/10"></div>
          </div>

          {loading ? (
            <div className="lg:col-span-3 flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : (
            walls.filter(w => w.is_active).map((wall) => (
              <motion.div
                key={wall.id}
                whileHover={{ y: -5 }}
                className="bg-surface border border-white/5 rounded-2xl overflow-hidden group cursor-pointer"
                onClick={() => navigate(`/admin/wall/${wall.slug}`)}
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-accent/20 text-accent text-[10px] px-3 py-1 rounded-full font-black uppercase">Live</div>
                    <span className="text-text-dim text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                      <Calendar size={12} /> {new Date(wall.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black mb-2 group-hover:text-accent transition-colors">{wall.name}</h3>
                  <p className="text-text-dim text-sm line-clamp-2 mb-6">{wall.description}</p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">/wall/{wall.slug}</span>
                    <ArrowRight size={20} className="text-accent group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))
          )}

          {/* Archived Walls Section */}
          <div className="lg:col-span-3 flex items-center gap-4 mt-12 mb-2">
            <History size={20} className="text-text-dim" />
            <h2 className="text-xl font-black uppercase tracking-tight text-text-dim">Archive</h2>
            <div className="h-px flex-1 bg-white/10"></div>
          </div>

          {walls.filter(w => !w.is_active).map((wall) => (
            <div
              key={wall.id}
              className="bg-surface/50 border border-white/5 rounded-2xl p-8 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => navigate(`/admin/wall/${wall.slug}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-white/10 text-text-dim text-[10px] px-3 py-1 rounded-full font-black uppercase">Archived</div>
                <span className="text-text-dim text-[10px] font-bold uppercase tracking-widest">{new Date(wall.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="text-xl font-black mb-2">{wall.name}</h3>
              <p className="text-text-dim text-xs line-clamp-2">{wall.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Create Wall Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-bg/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h2 className="text-2xl font-black uppercase tracking-tight">New Event Wall</h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-text-dim hover:text-white"><Plus className="rotate-45" /></button>
              </div>
              
              <form onSubmit={handleCreateWall} className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-accent mb-2">Event Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Gala 2024"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-accent text-white"
                    value={newWall.name}
                    onChange={(e) => setNewWall({ ...newWall, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-accent mb-2">Description</label>
                  <textarea
                    rows={3}
                    placeholder="What is this wall for?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-accent text-white resize-none"
                    value={newWall.description}
                    onChange={(e) => setNewWall({ ...newWall, description: e.target.value })}
                  />
                </div>
                
                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 py-4 font-black uppercase tracking-widest text-xs text-text-dim hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] bg-accent hover:bg-amber-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-accent/20 transition-all"
                  >
                    Launch Wall
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
