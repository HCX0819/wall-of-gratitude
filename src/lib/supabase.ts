import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export type Wall = {
  id: string;
  created_at: string;
  name: string;
  description: string;
  slug: string;
  is_active: boolean;
};

export type Note = {
  id: string;
  created_at: string;
  to_who: string;
  from_who: string;
  content: string;
  color: 'yellow' | 'blue' | 'pink' | 'green';
  is_featured: boolean;
  wall_id: string;
  image_url?: string;
  likes_count: number;
};
