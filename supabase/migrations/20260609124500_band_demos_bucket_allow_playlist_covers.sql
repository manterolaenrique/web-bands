update storage.buckets
set allowed_mime_types = array[
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/ogg',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif'
]
where id = 'band-demos';
