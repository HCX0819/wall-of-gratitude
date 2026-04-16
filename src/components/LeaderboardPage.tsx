import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Heart, MessageSquare, TrendingUp } from 'lucide-react';
import { supabase, type Note, type Wall } from '../lib/supabase';

export default function LeaderboardPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [wall, setWall] = useState<Wall | null>(null);
  const [topNotes, setTopNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Fetch Wall
        const { data: wallData, error: wallError } = await supabase
          .from('walls')
          .select('*')
          .eq('slug', slug)
          .single();

        if (wallError) throw wallError;
        setWall(wallData);

        // Fetch Top Notes
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .eq('wall_id', wallData.id)
          .order('likes_count', { ascending: false })
          .limit(10);

        if (notesError) throw notesError;
        setTopNotes(notesData || []);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [slug]);

  // Real-time updates for the leaderboard
  useEffect(() => {
    if (!wall?.id) return;

    const channel = supabase
      .channel(`leaderboard-realtime-${wall.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notes',
        filter: `wall_id=eq.${wall.id}`
      }, (payload: any) => {
        setTopNotes((current) => {
          const updated = current.map(n => n.id === payload.new.id ? payload.new as Note : n);
          // Re-sort and re-limit if necessary
          return [...updated].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [wall?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate(`/wall/${slug}`)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-bold uppercase tracking-widest text-xs">Back to Wall</span>
          </button>
          
          <div className="flex items-center gap-3">
            <Trophy className="text-accent" size={24} />
            <h1 className="text-xl font-black uppercase tracking-tighter italic">Leaderboard</h1>
          </div>

          <div className="w-20"></div> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-16">
        <div className="mb-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-px w-8 bg-accent/50"></span>
            <span className="text-[10px] uppercase tracking-[0.4em] text-accent font-black">Community Recognition</span>
            <span className="h-px w-8 bg-accent/50"></span>
          </div>
          <h2 className="text-5xl md:text-7xl font-light tracking-tight text-white flex flex-col items-center gap-2">
            <span className="font-sans font-extrabold uppercase">Most Loved</span>
            <span className="font-serif italic text-accent font-normal">Expressions</span>
          </h2>
          <p className="text-slate-400 font-medium mt-6 uppercase tracking-[0.2em] text-[10px]">{wall?.name}</p>
        </div>

        <div className="space-y-4">
          {topNotes.map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative group flex items-center gap-6 p-6 rounded-2xl border transition-all ${
                index === 0 ? 'bg-accent/10 border-accent/30' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-12 flex flex-col items-center">
                <span className={`text-3xl font-black italic ${
                  index === 0 ? 'text-accent' : 
                  index === 1 ? 'text-slate-300' : 
                  index === 2 ? 'text-amber-700' : 'text-slate-600'
                }`}>
                  #{index + 1}
                </span>
              </div>

              {/* Content */}
              <div className="flex-grow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      TO: {note.to_who}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      FROM: {note.from_who}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-accent font-black italic">
                    <Heart size={16} fill="currentColor" />
                    <span>{note.likes_count || 0}</span>
                  </div>
                </div>
                <p className="text-lg font-medium text-slate-200 line-clamp-2 italic">"{note.content}"</p>
              </div>

              {/* Small Preview Image if exists */}
              {note.image_url && (
                <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-slate-700">
                  <img src={note.image_url} alt="Note" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
            </motion.div>
          ))}

          {topNotes.length === 0 && (
            <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
              <TrendingUp size={48} className="mx-auto text-slate-700 mb-4 opacity-20" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No likes yet. Be the first!</p>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="mt-12 grid grid-cols-3 gap-4">
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center">
            <Heart className="mx-auto text-accent mb-2" size={24} />
            <div className="text-2xl font-black italic">{topNotes.reduce((acc, n) => acc + (n.likes_count || 0), 0)}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Likes</div>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center">
            <MessageSquare className="mx-auto text-blue-400 mb-2" size={24} />
            <div className="text-2xl font-black italic">{topNotes.length}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Top Notes</div>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center">
            <TrendingUp className="mx-auto text-green-400 mb-2" size={24} />
            <div className="text-2xl font-black italic">{topNotes[0]?.likes_count || 0}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Highest Score</div>
          </div>
        </div>
      </main>
    </div>
  );
}
