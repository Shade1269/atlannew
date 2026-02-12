
-- ====================================
-- المرحلة 4(د): توحيد نظام CMS (✅ نهائي ومُصحّح)
-- cms_custom_pages هو SSOT الآن
-- ====================================

-- 1️⃣ View للتوافق الخلفي من store_pages
CREATE OR REPLACE VIEW public.store_pages_compat AS
SELECT 
  id,
  page_title as title,
  page_slug as slug,
  meta_description as description,
  page_content as content,
  page_settings as settings,
  template_id,
  COALESCE(store_id, affiliate_store_id) as store_id,
  is_published,
  is_homepage,
  view_count,
  created_at,
  updated_at,
  published_at
FROM public.cms_custom_pages
WHERE store_id IS NOT NULL OR affiliate_store_id IS NOT NULL;

COMMENT ON VIEW public.store_pages_compat IS 'View للتوافق الخلفي: يعرض cms_custom_pages كـ store_pages';

-- 2️⃣ Backup View لـ page_builder قبل الأرشفة
CREATE OR REPLACE VIEW public.page_builder_archive AS
SELECT 
  pbe.id as element_id,
  pbe.page_id,
  pbe.element_type,
  pbe.element_name,
  pbe.element_config,
  pbe.element_styles,
  pbe.element_data,
  pbe.parent_id,
  pbe.sort_order,
  pbe.is_visible,
  pbe.is_locked,
  pbe.grid_column,
  pbe.grid_row,
  pbe.grid_span_x,
  pbe.grid_span_y,
  pbe.created_at as element_created_at,
  pbe.updated_at as element_updated_at,
  pbs.id as session_id,
  pbs.user_id,
  pbs.session_data,
  pbs.auto_save_data,
  pbs.last_activity,
  pbs.is_active as session_active,
  'ARCHIVED' as status
FROM public.page_builder_elements pbe
LEFT JOIN public.page_builder_sessions pbs ON pbs.page_id = pbe.page_id;

COMMENT ON VIEW public.page_builder_archive IS 'أرشيف: نسخة احتياطية من page_builder_* قبل الحذف';

-- 3️⃣ الفهارس على cms_custom_pages للأداء
CREATE INDEX IF NOT EXISTS idx_cms_pages_store_id 
  ON public.cms_custom_pages(store_id) 
  WHERE store_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cms_pages_affiliate_store_id 
  ON public.cms_custom_pages(affiliate_store_id) 
  WHERE affiliate_store_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cms_pages_slug 
  ON public.cms_custom_pages(page_slug);

CREATE INDEX IF NOT EXISTS idx_cms_pages_published 
  ON public.cms_custom_pages(is_published, published_at) 
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_cms_pages_homepage 
  ON public.cms_custom_pages(store_id, is_homepage) 
  WHERE is_homepage = true;

-- 4️⃣ Function: الحصول على صفحات متجر
CREATE OR REPLACE FUNCTION public.get_store_cms_pages(p_store_id UUID, p_affiliate_store_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  page_title TEXT,
  page_slug TEXT,
  meta_description TEXT,
  page_content JSONB,
  is_published BOOLEAN,
  is_homepage BOOLEAN,
  view_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id, page_title, page_slug, meta_description, page_content,
    is_published, is_homepage, view_count,
    created_at, updated_at, published_at
  FROM public.cms_custom_pages
  WHERE (
    (p_store_id IS NOT NULL AND store_id = p_store_id) OR
    (p_affiliate_store_id IS NOT NULL AND affiliate_store_id = p_affiliate_store_id)
  )
  ORDER BY 
    is_homepage DESC,
    updated_at DESC;
$$;

COMMENT ON FUNCTION public.get_store_cms_pages IS 'يحصل على جميع صفحات CMS لمتجر محدد';

-- 5️⃣ Function: صفحة مع widgets (مُصحّح)
CREATE OR REPLACE FUNCTION public.get_page_with_widgets(p_page_id UUID)
RETURNS TABLE (
  page_id UUID,
  page_title TEXT,
  page_slug TEXT,
  page_content JSONB,
  page_settings JSONB,
  is_published BOOLEAN,
  widgets JSONB
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cp.id as page_id,
    cp.page_title,
    cp.page_slug,
    cp.page_content,
    cp.page_settings,
    cp.is_published,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'widget_id', cw.id,
          'widget_name', cw.widget_name,
          'widget_type', cw.widget_type,
          'widget_config', cw.widget_config,
          'sort_order', cw.sort_order,
          'is_visible', cw.is_visible
        ) ORDER BY cw.sort_order
      ) FILTER (WHERE cw.id IS NOT NULL),
      '[]'::jsonb
    ) as widgets
  FROM public.cms_custom_pages cp
  LEFT JOIN public.cms_content_widgets cw ON cw.page_id = cp.id AND cw.is_visible = true
  WHERE cp.id = p_page_id
  GROUP BY cp.id, cp.page_title, cp.page_slug, cp.page_content, cp.page_settings, cp.is_published;
$$;

COMMENT ON FUNCTION public.get_page_with_widgets IS 'يحصل على صفحة CMS مع جميع widgets المرئية';

-- 6️⃣ Function: نشر صفحة CMS
CREATE OR REPLACE FUNCTION public.publish_cms_page(p_page_id UUID)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.cms_custom_pages WHERE id = p_page_id
  ) INTO v_page_exists;
  
  IF NOT v_page_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'الصفحة غير موجودة'
    );
  END IF;
  
  UPDATE public.cms_custom_pages
  SET 
    is_published = true,
    published_at = CASE 
      WHEN published_at IS NULL THEN NOW()
      ELSE published_at
    END,
    updated_at = NOW()
  WHERE id = p_page_id;
  
  INSERT INTO public.cms_page_revisions (page_id, content_snapshot, published)
  SELECT 
    id,
    jsonb_build_object(
      'page_title', page_title,
      'page_content', page_content,
      'page_settings', page_settings
    ),
    true
  FROM public.cms_custom_pages
  WHERE id = p_page_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'page_id', p_page_id,
    'published_at', NOW()
  );
END;
$$;

COMMENT ON FUNCTION public.publish_cms_page IS 'ينشر صفحة CMS ويحفظ revision';

-- 7️⃣ Function: فحص البيانات اليتيمة
CREATE OR REPLACE FUNCTION public.check_cms_orphans()
RETURNS TABLE (
  check_type TEXT,
  orphan_count BIGINT,
  details JSONB
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    'widgets_without_page'::TEXT,
    COUNT(*) as orphan_count,
    jsonb_agg(jsonb_build_object('widget_id', id, 'widget_type', widget_type)) as details
  FROM public.cms_content_widgets cw
  WHERE NOT EXISTS (
    SELECT 1 FROM public.cms_custom_pages WHERE id = cw.page_id
  )
  
  UNION ALL
  
  SELECT 
    'revisions_without_page'::TEXT,
    COUNT(*),
    jsonb_agg(jsonb_build_object('revision_id', id, 'created_at', created_at))
  FROM public.cms_page_revisions pr
  WHERE NOT EXISTS (
    SELECT 1 FROM public.cms_custom_pages WHERE id = pr.page_id
  )
  
  UNION ALL
  
  SELECT 
    'drafts_without_page'::TEXT,
    COUNT(*),
    jsonb_agg(jsonb_build_object('draft_id', id, 'created_at', created_at))
  FROM public.content_editor_drafts ced
  WHERE NOT EXISTS (
    SELECT 1 FROM public.cms_custom_pages WHERE id = ced.page_id
  )
  
  UNION ALL
  
  SELECT 
    'seo_analytics_without_page'::TEXT,
    COUNT(*),
    jsonb_agg(jsonb_build_object('analytics_id', id, 'created_at', created_at))
  FROM public.cms_seo_analytics csa
  WHERE NOT EXISTS (
    SELECT 1 FROM public.cms_custom_pages WHERE id = csa.page_id
  );
$$;

COMMENT ON FUNCTION public.check_cms_orphans IS 'يفحص البيانات اليتيمة في نظام CMS';

-- 8️⃣ تعليقات توضيحية
COMMENT ON TABLE public.cms_custom_pages IS 'SSOT: نظام CMS الموحد لجميع الصفحات (shops + affiliate_stores)';
COMMENT ON TABLE public.store_pages IS 'DEPRECATED: استخدم cms_custom_pages أو store_pages_compat view';
COMMENT ON TABLE public.page_builder_elements IS 'ARCHIVED: تم أرشفته في page_builder_archive view';
COMMENT ON TABLE public.page_builder_sessions IS 'ARCHIVED: تم أرشفته في page_builder_archive view';
