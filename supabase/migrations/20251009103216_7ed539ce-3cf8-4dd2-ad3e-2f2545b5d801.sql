-- Fix v_cms_pages_full view with correct column names
CREATE OR REPLACE VIEW v_cms_pages_full AS
SELECT 
  cp.id,
  cp.page_title,
  cp.page_slug,
  cp.meta_description,
  cp.meta_keywords,
  cp.page_content,
  cp.page_settings,
  cp.store_id,
  cp.affiliate_store_id,
  cp.is_published,
  cp.is_homepage,
  cp.view_count,
  cp.seo_score,
  cp.created_at,
  cp.updated_at,
  cp.published_at,
  pt.template_name,
  pt.template_data,
  COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id', w.id,
        'widget_type', w.widget_type,
        'widget_name', w.widget_name,
        'widget_data', w.widget_data,
        'sort_order', w.sort_order
      ) ORDER BY w.sort_order
    ) FROM cms_content_widgets w 
    WHERE w.page_id = cp.id AND w.is_visible = true),
    '[]'::jsonb
  ) as widgets
FROM cms_custom_pages cp
LEFT JOIN cms_page_templates pt ON pt.id = cp.template_id
WHERE cp.is_published = true;

-- Grant access
GRANT SELECT ON v_cms_pages_full TO authenticated, anon;

COMMENT ON VIEW v_cms_pages_full IS 'Complete CMS pages with templates and widgets';