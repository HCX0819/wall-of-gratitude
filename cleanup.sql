-- Wall of Gratitude - Cleanup Script
-- Run this ONLY in the project where you want to DELETE the tables and data

-- 1. Drop the tables
-- This will automatically delete all data, policies, and indexes associated with these tables.
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS walls;

-- That's it! The tables and all their configurations are now removed.
