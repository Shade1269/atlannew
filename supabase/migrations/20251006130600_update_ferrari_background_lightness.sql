
UPDATE public.store_themes
SET theme_config = jsonb_set(
  theme_config,
  '{colors,background}',
  '"hsl(220, 50%, 11%)"'::jsonb
)
WHERE name = 'Ferrari Racing'
AND theme_config->'colors'->>'background' = 'hsl(220, 50%, 6%)';
