-- Wall of Gratitude - Robust Database Migration Script
-- Run this in your Supabase SQL Editor

-- 1. Create the walls table
CREATE TABLE IF NOT EXISTS walls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- 2. Create or Update the notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  to_who TEXT NOT NULL,
  from_who TEXT NOT NULL,
  content TEXT NOT NULL,
  color TEXT CHECK (color IN ('yellow', 'blue', 'pink', 'green')) DEFAULT 'yellow',
  is_featured BOOLEAN DEFAULT false
);

-- Ensure wall_id column exists (in case notes table was created by a previous script)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='wall_id') THEN
    ALTER TABLE notes ADD COLUMN wall_id UUID REFERENCES walls(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='image_url') THEN
    ALTER TABLE notes ADD COLUMN image_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='likes_count') THEN
    ALTER TABLE notes ADD COLUMN likes_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- 3. Create likes table for tracking
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  ip_address TEXT, -- Simple way to limit likes without full auth
  user_id UUID -- For authenticated users
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE walls ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 5. Create policies
DROP POLICY IF EXISTS "Allow public read walls" ON walls;
CREATE POLICY "Allow public read walls" ON walls FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert walls" ON walls;
CREATE POLICY "Allow public insert walls" ON walls FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read notes" ON notes;
CREATE POLICY "Allow public read notes" ON notes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert notes" ON notes;
CREATE POLICY "Allow public insert notes" ON notes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update notes" ON notes;
CREATE POLICY "Allow public update notes" ON notes FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read likes" ON likes;
CREATE POLICY "Allow public read likes" ON likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert likes" ON likes;
CREATE POLICY "Allow public insert likes" ON likes FOR INSERT WITH CHECK (true);

-- 6. Enable Real-time
-- We use a DO block to avoid errors if the table is already in the publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'walls'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE walls;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notes;
  END IF;
END $$;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS notes_wall_id_idx ON notes (wall_id);
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes (created_at DESC);

-- 7. Sample Data
INSERT INTO walls (name, slug, description) 
VALUES ('Main Event 2024', 'main-2024', 'The primary gratitude wall for the Annual Excellence Summit.')
ON CONFLICT (slug) DO NOTHING;

-- 8. Storage Setup
-- Automatically create the 'note-images' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('note-images', 'note-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up Storage Policies
DROP POLICY IF EXISTS "Allow public read on images" ON storage.objects;
CREATE POLICY "Allow public read on images"
ON storage.objects FOR SELECT
USING (bucket_id = 'note-images');

DROP POLICY IF EXISTS "Allow public upload on images" ON storage.objects;
CREATE POLICY "Allow public upload on images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'note-images');
