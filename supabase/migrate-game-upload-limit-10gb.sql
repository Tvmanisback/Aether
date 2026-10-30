-- Raise Aether game storage bucket per-file limits to 10 GiB.
-- Run this in Supabase SQL Editor for an existing Aether project.
-- Also check Project Settings > Storage for the project's global file-size limit
-- and raise it to at least 10 GiB if your plan allows it.

update storage.buckets
set file_size_limit = 10737418240
where id in ('game-submissions','published-games');
