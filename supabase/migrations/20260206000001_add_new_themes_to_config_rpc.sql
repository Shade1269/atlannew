-- إضافة 4 ثيمات جديدة لـ get_store_theme_config + إضافة قيم enum جديدة

-- إضافة قيم enum جديدة
ALTER TYPE theme_type ADD VALUE IF NOT EXISTS 'rose_boutique';
ALTER TYPE theme_type ADD VALUE IF NOT EXISTS 'navy_exec';
ALTER TYPE theme_type ADD VALUE IF NOT EXISTS 'mint_fresh';
ALTER TYPE theme_type ADD VALUE IF NOT EXISTS 'royal_gold';

-- تحديث الدالة لتشمل الثيمات الجديدة
CREATE OR REPLACE FUNCTION get_store_theme_config(p_store_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_theme_config JSONB;
  v_custom_config JSONB;
  v_theme_enum TEXT;
  v_fallback_config JSONB;
BEGIN
  SELECT 
    st.theme_config,
    COALESCE(ast.custom_config, '{}'),
    as_table.theme::TEXT
  INTO v_theme_config, v_custom_config, v_theme_enum
  FROM affiliate_stores as_table
  LEFT JOIN store_themes st ON st.id = as_table.current_theme_id
  LEFT JOIN affiliate_store_themes ast ON ast.store_id = as_table.id
  WHERE as_table.id = p_store_id;

  IF (v_theme_config IS NULL OR v_theme_config = '{}'::jsonb) AND v_theme_enum IS NOT NULL THEN
    v_fallback_config := CASE v_theme_enum
      WHEN 'modern' THEN '{"colors":{"primary":"210 100% 50%","secondary":"262 83% 58%","accent":"210 100% 50%","background":"0 0% 100%","foreground":"222 47% 11%","muted":"210 40% 96%","muted-foreground":"215 16% 47%","card":"0 0% 100%","border":"214 32% 91%"}}'::jsonb
      WHEN 'elegant' THEN '{"colors":{"primary":"38 92% 50%","secondary":"48 96% 53%","accent":"38 92% 50%","background":"0 0% 100%","foreground":"222 47% 11%","muted":"48 30% 96%","muted-foreground":"215 16% 47%","card":"0 0% 100%","border":"214 32% 91%"}}'::jsonb
      WHEN 'gold' THEN '{"colors":{"primary":"160 84% 39%","secondary":"187 92% 46%","accent":"160 84% 39%","background":"0 0% 100%","foreground":"222 47% 11%","muted":"160 20% 96%","muted-foreground":"215 16% 47%","card":"0 0% 100%","border":"214 32% 91%"}}'::jsonb
      WHEN 'classic' THEN '{"colors":{"primary":"220 13% 46%","secondary":"220 9% 61%","accent":"220 13% 46%","background":"0 0% 100%","foreground":"222 47% 11%","muted":"220 14% 96%","muted-foreground":"215 16% 47%","card":"0 0% 100%","border":"214 32% 91%"}}'::jsonb
      WHEN 'feminine' THEN '{"colors":{"primary":"330 81% 60%","secondary":"340 75% 55%","accent":"330 81% 60%","background":"0 0% 100%","foreground":"222 47% 11%","muted":"330 30% 97%","muted-foreground":"215 16% 47%","card":"0 0% 100%","border":"214 32% 91%"}}'::jsonb
      WHEN 'damascus' THEN '{"colors":{"primary":"25 95% 53%","secondary":"35 90% 50%","accent":"25 95% 53%","background":"0 0% 100%","foreground":"222 47% 11%","muted":"25 30% 96%","muted-foreground":"215 16% 47%","card":"0 0% 100%","border":"214 32% 91%"}}'::jsonb
      WHEN 'legendary' THEN '{"colors":{"primary":"262 83% 58%","secondary":"280 67% 58%","accent":"262 83% 58%","background":"222 47% 11%","foreground":"210 40% 98%","muted":"217 33% 17%","muted-foreground":"215 20% 65%","card":"217 33% 17%","border":"217 33% 24%"}}'::jsonb
      WHEN 'alliance_special' THEN '{"colors":{"primary":"142 76% 36%","secondary":"160 84% 39%","accent":"142 76% 36%","background":"0 0% 100%","foreground":"222 47% 11%","muted":"142 20% 96%","muted-foreground":"215 16% 47%","card":"0 0% 100%","border":"214 32% 91%"}}'::jsonb
      -- 4 ثيمات جديدة
      WHEN 'rose_boutique' THEN '{"colors":{"primary":"340 82% 52%","secondary":"330 81% 60%","accent":"340 82% 52%","background":"0 0% 100%","foreground":"222 47% 11%","muted":"340 30% 96%","muted-foreground":"215 16% 47%","card":"0 0% 100%","border":"340 20% 90%"}}'::jsonb
      WHEN 'navy_exec' THEN '{"colors":{"primary":"215 52% 25%","secondary":"217 91% 60%","accent":"215 52% 25%","background":"0 0% 100%","foreground":"222 47% 11%","muted":"215 30% 96%","muted-foreground":"215 16% 47%","card":"0 0% 100%","border":"215 20% 90%"}}'::jsonb
      WHEN 'mint_fresh' THEN '{"colors":{"primary":"168 76% 32%","secondary":"168 56% 50%","accent":"168 76% 32%","background":"0 0% 100%","foreground":"222 47% 11%","muted":"168 30% 96%","muted-foreground":"215 16% 47%","card":"0 0% 100%","border":"168 20% 90%"}}'::jsonb
      WHEN 'royal_gold' THEN '{"colors":{"primary":"43 89% 38%","secondary":"38 92% 50%","accent":"43 89% 38%","background":"0 0% 100%","foreground":"222 47% 11%","muted":"43 30% 96%","muted-foreground":"215 16% 47%","card":"0 0% 100%","border":"43 20% 90%"}}'::jsonb
      ELSE '{"colors":{"primary":"210 100% 50%","secondary":"262 83% 58%","accent":"210 100% 50%","background":"0 0% 100%","foreground":"222 47% 11%","muted":"210 40% 96%","muted-foreground":"215 16% 47%","card":"0 0% 100%","border":"214 32% 91%"}}'::jsonb
    END;
    v_theme_config := v_fallback_config;
  END IF;

  RETURN COALESCE(v_theme_config, '{}') || COALESCE(v_custom_config, '{}');
END;
$$;
