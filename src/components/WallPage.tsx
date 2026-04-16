import React, { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Send, Plus, X, Users, MessageSquare, TrendingUp, QrCode, ArrowLeft, Image as ImageIcon, Loader2, Trophy, Search, Trash2, Share2, Copy, Check } from 'lucide-react';
import { supabase, type Note, type Wall } from '../lib/supabase';

const SAMPLE_NOTES: Note[] = [
  {
    id: 'sample-1',
    to_who: 'Sarah K.',
    from_who: 'David M.',
    content: "Thanks to Sarah for the incredible mentoring session yesterday. You changed my perspective!",
    color: 'yellow',
    is_featured: false,
    created_at: new Date().toISOString(),
    wall_id: 'sample-1',
    likes_count: 5
  },
  {
    id: 'sample-2',
    to_who: 'Ops Team',
    from_who: 'Anon',
    content: "The logistics team is killing it this year. Smoothest event ever!",
    color: 'blue',
    is_featured: false,
    created_at: new Date().toISOString(),
    wall_id: 'sample-1',
    likes_count: 12
  },
  {
    id: 'sample-3',
    to_who: 'Everyone',
    from_who: 'Marcus T.',
    content: "I want to thank the entire community here for being so welcoming. This culture of gratitude is what makes this event special. It's truly inspiring to see so much positivity in one place.",
    color: 'yellow',
    is_featured: true,
    created_at: new Date().toISOString(),
    wall_id: 'sample-1',
    likes_count: 24
  },
  {
    id: 'sample-4',
    to_who: 'James',
    from_who: 'Lily',
    content: "Coffee is on me tomorrow! Thanks for helping with the bug.",
    color: 'pink',
    is_featured: false,
    created_at: new Date().toISOString(),
    wall_id: 'sample-1',
    likes_count: 3
  },
  {
    id: 'sample-5',
    to_who: 'Design Team',
    from_who: 'Product',
    content: "The new UI looks stunning. The attention to detail is just next level.",
    color: 'green',
    is_featured: false,
    created_at: new Date().toISOString(),
    wall_id: 'sample-1',
    likes_count: 8
  },
  {
    id: 'sample-6',
    to_who: 'Alex',
    from_who: 'Sam',
    content: "Great presentation today! You really nailed the delivery.",
    color: 'yellow',
    is_featured: false,
    created_at: new Date().toISOString(),
    wall_id: 'sample-1',
    likes_count: 15
  },
  {
    id: 'sample-7',
    to_who: 'Marketing',
    from_who: 'Sales',
    content: "The new campaign is already bringing in great leads. Thank you!",
    color: 'blue',
    is_featured: false,
    created_at: new Date().toISOString(),
    wall_id: 'sample-1',
    likes_count: 20
  },
  {
    id: 'sample-8',
    to_who: 'HR',
    from_who: 'New Hire',
    content: "The onboarding process was so smooth. I felt welcome from day one.",
    color: 'pink',
    is_featured: false,
    created_at: new Date().toISOString(),
    wall_id: 'sample-1',
    likes_count: 6
  },
  {
    id: 'sample-9',
    to_who: 'Tech Support',
    from_who: 'User 123',
    content: "Fastest response time I've ever seen. Problem solved in 5 minutes!",
    color: 'green',
    is_featured: false,
    created_at: new Date().toISOString(),
    wall_id: 'sample-1',
    likes_count: 10
  },
  {
    id: 'sample-10',
    to_who: 'Project Manager',
    from_who: 'Dev Team',
    content: "Thanks for shielding us from the scope creep. We really appreciate it.",
    color: 'yellow',
    is_featured: false,
    created_at: new Date().toISOString(),
    wall_id: 'sample-1',
    likes_count: 18
  },
  // Generating more notes to reach 60+
  ...Array.from({ length: 50 }).map((_, i) => ({
    id: `sample-gen-${i}`,
    to_who: ['Team', 'Manager', 'Colleague', 'Friend', 'Mentor'][i % 5],
    from_who: ['Alice', 'Bob', 'Charlie', 'Diana', 'Edward'][i % 5],
    content: [
      "You're doing an amazing job!",
      "Thanks for the support during the crunch time. We couldn't have done it without your dedication and hard work.",
      "Keep up the great work! Your positive attitude is contagious.",
      "I'm so grateful for your help on the last project. It really made a difference.",
      "You're a rockstar! Thanks for always going above and beyond.",
      "Just wanted to say thanks for being awesome.",
      "Your creativity is inspiring. I love the way you approach problems.",
      "Thanks for the feedback. It was really helpful.",
      "I appreciate your patience while I was learning the ropes.",
      "You're a great leader. Thanks for guiding us."
    ][i % 10] + (i % 3 === 0 ? " This is a longer message to test how the masonry layout handles different heights of sticky notes on the wall." : ""),
    color: ['yellow', 'blue', 'pink', 'green'][i % 4] as any,
    is_featured: i % 15 === 0,
    created_at: new Date(Date.now() - i * 3600000).toISOString(),
    wall_id: 'sample-1',
    likes_count: Math.floor(Math.random() * 100),
    image_url: i % 7 === 0 ? `https://picsum.photos/seed/gratitude-${i}/400/300` : undefined
  }))
];

export default function WallPage({ isAdmin = false, isDemo = false }: { isAdmin?: boolean, isDemo?: boolean }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [wall, setWall] = useState<Wall | null>(isDemo ? { id: 'demo', name: 'Gratitude Wall Demo', slug: 'demo', created_at: new Date().toISOString(), user_id: 'demo' } : null);
  const [notes, setNotes] = useState<Note[]>(SAMPLE_NOTES);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    to_who: '',
    from_who: '',
    content: '',
    color: 'yellow' as Note['color'],
  });
  const [loading, setLoading] = useState(true);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);
  const [likedNoteIds, setLikedNoteIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('liked_notes');
    if (saved) {
      try {
        setLikedNoteIds(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error('Error parsing liked notes:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (isDemo) {
      setLoading(false);
      return;
    }
    const url = (import.meta as any).env.VITE_SUPABASE_URL;
    const key = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
    
    if (url && key && url !== 'your_supabase_project_url') {
      setIsSupabaseConfigured(true);
      
      const fetchWallAndNotes = async () => {
        try {
          // Fetch Wall
          const { data: wallData, error: wallError } = await supabase
            .from('walls')
            .select('*')
            .eq('slug', slug)
            .single();

          if (wallError) throw wallError;
          setWall(wallData);

          // Fetch Notes for this Wall
          const { data: notesData, error: notesError } = await supabase
            .from('notes')
            .select('*')
            .eq('wall_id', wallData.id)
            .order('created_at', { ascending: false });

          if (notesError) throw notesError;
          setNotes(notesData || []);
        } catch (err) {
          console.error('Error fetching data:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchWallAndNotes();
    } else {
      setLoading(false);
    }
  }, [slug]);

  // Separate effect for real-time subscription to ensure reliable cleanup
  useEffect(() => {
    if (isDemo || !wall?.id || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`wall-realtime-${wall.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notes',
        filter: `wall_id=eq.${wall.id}`
      }, (payload: any) => {
        setNotes((current) => [payload.new as Note, ...current]);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notes',
        filter: `wall_id=eq.${wall.id}`
      }, (payload: any) => {
        setNotes((current) => current.map(n => n.id === payload.new.id ? payload.new as Note : n));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [wall?.id, isSupabaseConfigured]);

  const handleLike = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const isLiked = likedNoteIds.has(noteId);
    const newLikesCount = isLiked ? Math.max(0, (note.likes_count || 0) - 1) : (note.likes_count || 0) + 1;

    // Optimistic UI update
    setNotes(current => current.map(n => 
      n.id === noteId ? { ...n, likes_count: newLikesCount } : n
    ));

    // Update local state
    const newLikedIds = new Set(likedNoteIds);
    if (isLiked) {
      newLikedIds.delete(noteId);
    } else {
      newLikedIds.add(noteId);
    }
    setLikedNoteIds(newLikedIds);
    localStorage.setItem('liked_notes', JSON.stringify(Array.from(newLikedIds)));

    if (!isSupabaseConfigured) return;

    try {
      // 1. Update likes_count in notes table
      const { error: updateError } = await supabase
        .from('notes')
        .update({ likes_count: newLikesCount })
        .eq('id', noteId);

      if (updateError) throw updateError;

      // 2. Record or remove the like in the likes table
      if (!isLiked) {
        await supabase.from('likes').insert([{ note_id: noteId }]);
      } else {
        // For public walls without unique user IDs, we just decrement the count.
        // If we had user IDs, we would delete the specific like row here.
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      // Revert optimistic update on error
      setNotes(current => current.map(n => 
        n.id === noteId ? { ...n, likes_count: isLiked ? (note.likes_count || 0) : Math.max(0, (note.likes_count || 0)) } : n
      ));
      // Revert local state
      setLikedNoteIds(likedNoteIds);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    // Optimistic UI update
    const noteToDelete = notes.find(n => n.id === noteId);
    setNotes(current => current.filter(n => n.id !== noteId));

    if (!isSupabaseConfigured) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting note:', err);
      // Revert optimistic update
      if (noteToDelete) {
        setNotes(current => [noteToDelete, ...current]);
      }
    }
  };

  const handleCopyLink = () => {
    const userLink = `${window.location.origin}/wall/${slug}`;
    navigator.clipboard.writeText(userLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.to_who || !formData.from_who || !formData.content) return;

    setIsUploading(true);
    let uploadedImageUrl = '';

    try {
      if (imageFile && isSupabaseConfigured) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('note-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('note-images')
          .getPublicUrl(filePath);
        
        uploadedImageUrl = publicUrl;
      } else if (imageFile && !isSupabaseConfigured) {
        // Demo mode: use preview as URL
        uploadedImageUrl = imagePreview || '';
      }

      if (!isSupabaseConfigured || !wall) {
        const newNote: Note = {
          id: Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString(),
          is_featured: false,
          wall_id: wall?.id || 'demo',
          image_url: uploadedImageUrl,
          ...formData
        };
        setNotes([newNote, ...notes]);
        resetForm();
        return;
      }

      const { error } = await supabase.from('notes').insert([{
        ...formData,
        wall_id: wall.id,
        image_url: uploadedImageUrl
      }]);
      if (error) throw error;
      
      resetForm();
    } catch (err) {
      console.error('Error posting note:', err);
      alert('Failed to post note.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({ to_who: '', from_who: '', content: '', color: 'yellow' });
    setImageFile(null);
    setImagePreview(null);
    setIsFormOpen(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getColorClass = (color: Note['color']) => {
    switch (color) {
      case 'yellow': return 'note-y';
      case 'blue': return 'note-b';
      case 'pink': return 'note-p';
      case 'green': return 'note-g';
      default: return 'note-y';
    }
  };

  const filteredNotes = notes.filter(note => {
    const query = searchQuery.toLowerCase();
    return note.to_who.toLowerCase().includes(query) || 
           note.from_who.toLowerCase().includes(query);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-bg text-text-main overflow-x-hidden wall-background">
      {/* Header */}
      <header className="px-6 md:px-10 py-12 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 glass-header z-20">
        <div className="header-title flex items-center gap-6">
          {(isAdmin || isDemo) && (
            <button 
              onClick={() => navigate('/admin')}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-text-dim hover:text-white transition-all border border-white/10"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-1">
              <span className="h-px w-8 bg-accent/50 hidden md:block"></span>
              <span className="text-[10px] uppercase tracking-[0.4em] text-text-dim font-black">
                {wall?.name || 'Curated Collection'} {isAdmin && '— Admin Portal'}
                {isDemo && <span className="ml-3 text-accent animate-pulse inline-flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-accent"></span> DEMO</span>}
              </span>
            </div>
            <h1 className="text-4xl md:text-7xl font-light tracking-tight text-white flex flex-wrap items-baseline gap-x-4">
              <span className="font-sans font-extrabold uppercase">Wall of</span>
              <span className="font-serif italic text-accent font-normal">Gratitude</span>
            </h1>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative w-full md:w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search by name or team..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-full py-3 pl-12 pr-6 text-sm focus:outline-none focus:ring-1 focus:ring-accent/30 focus:bg-white/[0.05] transition-all placeholder:text-text-dim/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-10">
            <div className="flex flex-col items-center md:items-end">
              <div className="flex items-center gap-2">
                <MessageSquare size={20} className="text-accent/70" />
                <span className="text-3xl font-light tracking-tighter">
                  {notes.length.toLocaleString()}
                </span>
              </div>
              <span className="text-[9px] uppercase tracking-[0.3em] text-text-dim font-bold mt-1">Notes Collected</span>
            </div>
            <div className="flex flex-col items-center md:items-end">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-accent/70" />
                <span className="text-3xl font-light tracking-tighter">
                  2,000
                </span>
              </div>
              <span className="text-[9px] uppercase tracking-[0.3em] text-text-dim font-bold mt-1">Attendees</span>
            </div>
          </div>
          
          {!isDemo && (
            <div className="flex gap-3">
              {isAdmin && (
                <button 
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold uppercase tracking-widest text-xs border border-white/10 transition-all group"
                >
                  <Share2 size={18} className="group-hover:scale-110 transition-transform" />
                  Share Wall
                </button>
              )}
              <button 
                onClick={() => navigate(`/leaderboard/${slug}`)}
                className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-amber-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-accent/20 transition-all group"
              >
                <Trophy size={18} className="group-hover:scale-110 transition-transform" />
                Leaderboard
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Wall */}
      <main className="flex-1 p-6 md:p-10 custom-scrollbar relative">
        <div className="columns-1 sm:columns-2 lg:columns-4 xl:columns-6 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note, index) => {
                // Stable random-ish rotation based on index
                const rotations = [-1.5, 1.2, -0.8, 1.5, -1.2, 0.8];
                const rotation = rotations[index % rotations.length];
                
                return (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ scale: 0, opacity: 0, rotate: rotation - 5 }}
                    animate={{ scale: 1, opacity: 1, rotate: rotation }}
                    exit={{ scale: 0, opacity: 0 }}
                    className={`note-card group break-inside-avoid ${getColorClass(note.color)} ${note.is_featured ? 'featured-note' : ''}`}
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                  {note.is_featured && (
                    <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] px-3 py-1 rounded-full font-black shadow-lg z-20">
                      FEATURED
                    </span>
                  )}
                  {isAdmin && (
                    <button 
                      onClick={() => handleDeleteNote(note.id)}
                      className="absolute top-2 right-2 p-1.5 bg-black/5 hover:bg-red-500 hover:text-white rounded-lg transition-all opacity-40 group-hover:opacity-100 z-20"
                      title="Delete Note"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <p className="note-content">"{note.content}"</p>
                  {note.image_url && (
                    <div className="mt-auto mb-4 rounded-md overflow-hidden border border-black/5">
                      <img 
                        src={note.image_url} 
                        alt="Attached" 
                        className="w-full h-32 object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div className="note-meta">
                    <span>TO: {note.to_who}</span>
                    <span className="note-from">— {note.from_who}</span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
                    <button 
                      onClick={() => handleLike(note.id)}
                      className="flex items-center gap-1.5 text-slate-600 hover:text-accent transition-colors group"
                    >
                      <Heart 
                        size={18} 
                        className={`transition-transform group-active:scale-125 ${likedNoteIds.has(note.id) ? 'text-accent' : ''}`} 
                        fill={likedNoteIds.has(note.id) ? 'currentColor' : 'none'} 
                      />
                      <span className="font-bold text-xs">{note.likes_count || 0}</span>
                    </button>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black/20">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              );
            })
          ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-20 text-center"
              >
                <div className="bg-white/5 inline-block p-6 rounded-full mb-4">
                  <Search size={48} className="text-text-dim" />
                </div>
                <h3 className="text-xl font-bold text-text-dim">No notes found matching "{searchQuery}"</h3>
                <p className="text-sm text-text-dim/60 mt-2">Try searching for a different name or team.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Sidebar CTA */}
        {!isDemo && (
          <div className="fixed right-10 bottom-10 w-72 bg-white p-6 rounded-2xl text-slate-900 sidebar-shadow z-50 border-4 border-accent hidden lg:block">
            <div className="w-24 h-24 bg-slate-100 mx-auto mb-4 border border-slate-200 flex flex-col items-center justify-center text-[8px] text-center p-2 rounded-lg">
              <QrCode size={48} className="mb-1 text-slate-800" />
              SCAN TO POST
            </div>
            <h3 className="text-lg font-black mb-2 text-center uppercase tracking-tight">Add Your Voice</h3>
            <button
              onClick={() => setIsFormOpen(true)}
              className="w-full bg-accent hover:bg-amber-600 text-white py-3 rounded-lg font-bold uppercase text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Write a Sticky Note
            </button>
          </div>
        )}

        {/* Mobile FAB */}
        {!isDemo && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="lg:hidden fixed bottom-8 right-8 w-16 h-16 bg-accent text-white rounded-full shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] flex items-center justify-center z-50 transition-all active:scale-95 border-2 border-white/20"
          >
            <Plus size={28} strokeWidth={3} />
          </button>
        )}
      </main>

      {/* Post Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
            >
              {/* Left Side: Form */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="bg-accent p-6 flex justify-between items-center text-white">
                  <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                    <Heart size={24} fill="currentColor" /> Spread Gratitude
                  </h2>
                  <button onClick={() => setIsFormOpen(false)} className="md:hidden hover:bg-black/10 p-1 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">To Who?</label>
                      <input
                        type="text"
                        required
                        placeholder="Name or Team"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 text-slate-800 text-sm"
                        value={formData.to_who}
                        onChange={(e) => setFormData({ ...formData, to_who: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">From Who?</label>
                      <input
                        type="text"
                        required
                        placeholder="Your Name"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 text-slate-800 text-sm"
                        value={formData.from_who}
                        onChange={(e) => setFormData({ ...formData, from_who: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Your Message</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="What are you grateful for?"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 text-slate-800 text-sm resize-none"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    />
                  </div>
  
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Note Color</label>
                    <div className="flex gap-3">
                      {(['yellow', 'blue', 'pink', 'green'] as const).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: c })}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            formData.color === c ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent'
                          } ${
                            c === 'yellow' ? 'bg-note-y' : 
                            c === 'blue' ? 'bg-note-b' : 
                            c === 'pink' ? 'bg-note-p' : 'bg-note-g'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
  
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Add a Photo (Optional)</label>
                    <div className="flex items-center gap-4">
                      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors text-slate-500 text-sm">
                        <ImageIcon size={18} />
                        {imageFile ? 'Change Photo' : 'Upload Photo'}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleImageChange}
                        />
                      </label>
                      {imagePreview && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => { setImageFile(null); setImagePreview(null); }}
                            className="absolute top-0 right-0 bg-black/50 text-white p-0.5 rounded-bl-lg"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
  
                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={resetForm}
                      className="flex-1 px-6 py-3 font-bold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="flex-[2] bg-accent hover:bg-amber-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} 
                      {isUploading ? 'Uploading...' : 'Post Note'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Side: Live Preview */}
              <div className="hidden md:flex flex-1 bg-slate-900 p-10 items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
                </div>
                
                <div className="relative z-10 w-full max-w-[280px]">
                  <div className="text-center mb-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent/60">Live Preview</span>
                  </div>
                  
                  <motion.div
                    layout
                    className={`note-card ${getColorClass(formData.color)} shadow-2xl scale-110`}
                  >
                    <p className="note-content min-h-[60px]">
                      {formData.content ? `"${formData.content}"` : '"Your message will appear here..."'}
                    </p>
                    {imagePreview && (
                      <div className="mt-auto mb-4 rounded-md overflow-hidden border border-black/5">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    )}
                    <div className="note-meta">
                      <span>TO: {formData.to_who || 'Recipient'}</span>
                      <span className="note-from">— {formData.from_who || 'You'}</span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Heart size={18} />
                        <span className="font-bold text-xs">0</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-black/20">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </motion.div>
                </div>

                <button 
                  onClick={() => setIsFormOpen(false)} 
                  className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 bg-bg/90 backdrop-blur-md flex items-center justify-center z-[110] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface w-full max-w-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-accent/10">
                <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                  <Share2 className="text-accent" /> Share Wall
                </h2>
                <button onClick={() => setIsShareModalOpen(false)} className="text-text-dim hover:text-white"><X size={24} /></button>
              </div>
              
              <div className="p-8 space-y-6">
                <p className="text-text-dim text-sm">
                  Copy this link to share the wall with your attendees. They will be able to read all notes and post their own gratitude notes.
                </p>
                
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/wall/${slug}`}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 pr-16 focus:outline-none text-white text-sm font-mono"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-accent hover:bg-amber-600 text-white rounded-lg transition-all"
                    title="Copy Link"
                  >
                    {isCopied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>

                {isCopied && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-accent text-xs font-bold uppercase tracking-widest text-center"
                  >
                    Link copied to clipboard!
                  </motion.p>
                )}

                <div className="pt-4">
                  <button
                    onClick={() => setIsShareModalOpen(false)}
                    className="w-full py-4 font-black uppercase tracking-widest text-xs text-text-dim hover:text-white border border-white/5 rounded-xl transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
