-- P0/P1 storage upload hardening. Review before applying.
UPDATE storage.buckets
SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
WHERE id = 'progress-photos';

UPDATE storage.buckets
SET
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'video/mp4',
    'video/quicktime',
    'video/x-m4v',
    'video/webm'
  ]
WHERE id = 'exercise-videos';
