-- تحميل الذاكرة التأسيسية الشاملة لعقل المشروع
-- هذه الذاكرة تحتوي على كل ما يحتاجه العقل لفهم المشروع

-- 1. الذاكرة الأساسية - هوية المشروع
INSERT INTO brain_memory (memory_type, title, content, importance_score, tags, context) VALUES
('foundation', 'هوية المشروع - منصة أطلانتس', 
'منصة أطلانتس هي منصة تجارة إلكترونية سعودية متكاملة تجمع بين التسويق بالعمولة (Affiliate Marketing) ونظام التيمات (Gamification). تأسست لتكون بديلاً سعودياً لمنصات مثل Shopify وSalla مع إضافة عناصر التنافس والتحفيز. الهدف هو تمكين المسوقين السعوديين من إنشاء متاجرهم الخاصة وكسب العمولات من خلال بيع منتجات التجار.',
10, ARRAY['تأسيس', 'هوية', 'رؤية'], 
'{"project_type": "e-commerce_affiliate", "target_market": "Saudi Arabia", "language": "Arabic RTL"}'::jsonb),

('foundation', 'التقنيات المستخدمة في البناء',
'المشروع مبني على: React 18 + TypeScript + Vite للفرونت إند، Tailwind CSS + shadcn/ui للتصميم، Supabase للباك إند (PostgreSQL + Auth + Storage + Edge Functions)، نظام تصميم Anaqati (maroon #5A2647 + pink #F4C2C2 + gold #C89B3C). البنية تتبع نمط Feature-Based Organization مع 9 features رئيسية: admin, affiliate, analytics, atlantis-world, auth, cart, chat, commerce, storefront.',
10, ARRAY['تقنيات', 'بنية', 'تصميم'],
'{"frontend": "React+TypeScript+Vite", "styling": "Tailwind+shadcn", "backend": "Supabase", "design_system": "Anaqati"}'::jsonb),

('foundation', 'هيكل قاعدة البيانات',
'قاعدة البيانات تحتوي على 237 جدول في schema public. الجداول الأساسية: profiles (المستخدمين)، products (المنتجات)، merchants (التجار)، affiliate_stores (متاجر المسوقين)، order_hub (الطلبات الموحدة)، commissions (العمولات)، wallet_balances (المحافظ)، alliances (التحالفات)، user_levels (مستويات اللاعبين). كل جدول له RLS policies لحماية البيانات.',
10, ARRAY['قاعدة_بيانات', 'جداول', 'أمان'],
'{"total_tables": 237, "core_tables": ["profiles", "products", "merchants", "affiliate_stores", "order_hub", "commissions"]}'::jsonb),

('foundation', 'أنظمة المستخدمين والأدوار',
'يوجد 5 أدوار رئيسية: admin (مدير النظام)، merchant (تاجر يضيف منتجات)، affiliate (مسوق لديه متجر)، moderator (مشرف الدردشة)، customer (عميل). الأدوار تُخزن في جدول user_roles منفصل عن profiles لمنع ثغرات تصعيد الصلاحيات. يتم التحقق من الأدوار عبر دالة has_role() الآمنة.',
9, ARRAY['أدوار', 'مستخدمين', 'أمان'],
'{"roles": ["admin", "merchant", "affiliate", "moderator", "customer"], "security": "separate_roles_table"}'::jsonb),

('foundation', 'نظام التيمات والتحفيز - أطلانتس',
'نظام Atlantis هو قلب التحفيز في المنصة. يشمل: User Levels (Bronze, Silver, Gold, Legendary) - مستويات تُكتسب بالنقاط من المبيعات. Alliances (تحالفات) - فرق تتنافس أسبوعياً للسيطرة على القلعة. Weekly Challenges - تحديات أسبوعية بمكافآت. Leaderboards - لوحات المتصدرين. Chat Rooms - غرف دردشة بقيود حسب المستوى (Silver+ لإنشاء غرف). Atlantis World - لعبة استراتيجية 3D مدمجة.',
10, ARRAY['تيمات', 'أطلانتس', 'تحفيز'],
'{"levels": ["Bronze", "Silver", "Gold", "Legendary"], "features": ["alliances", "challenges", "leaderboards", "chat", "world_game"]}'::jsonb),

('foundation', 'نظام التجارة والطلبات',
'دورة الطلب: العميل يتصفح متجر المسوق → يضيف للسلة → يدفع (Geidea) → ينشأ order في ecommerce_orders → ينتقل لـ order_hub → تُحسب العمولات تلقائياً → يُشحن → يتأكد التسليم → تُؤكد العمولات. المسوق يحصل على فرق السعر كعمولة. التاجر يحصل على سعره الأساسي. المنصة تحصل على 25% من سعر التاجر.',
9, ARRAY['تجارة', 'طلبات', 'عمولات'],
'{"payment_gateway": "Geidea", "order_flow": ["cart", "payment", "order_hub", "commission", "shipment", "delivery"], "platform_cut": "25%"}'::jsonb),

('foundation', 'Edge Functions المتاحة',
'يوجد 48 Edge Function تخدم أغراض مختلفة: AI functions (ai-chat, ai-image-generator, ai-content-generator, ai-analytics, chat-assistant, project-brain)، Payment (create-geidea-session, geidea-webhook, process-geidea-callback)، OTP/Auth (create-customer-otp-session, verify-customer-otp, setup-2fa, verify-2fa)، Orders (create-ecommerce-order, process-affiliate-order)، Integrations (send-order-to-zoho-flow, update-order-invoice)، Meeting (livekit-token).',
8, ARRAY['edge_functions', 'API', 'خدمات'],
'{"total_functions": 48, "categories": ["AI", "Payment", "Auth", "Orders", "Integrations", "Realtime"]}'::jsonb),

('foundation', 'نظام الدفع والمحافظ',
'بوابة الدفع الرئيسية: Geidea (سعودية). كل مسوق له wallet_balances (رصيد متاح + معلق). كل تاجر له merchant_wallet_balances. العمولات تبدأ PENDING ثم تتحول لـ CONFIRMED عند التسليم. السحب يتم عبر withdrawal_requests بموافقة الإدارة. الحد الأدنى للسحب: 100 ريال.',
9, ARRAY['دفع', 'محافظ', 'عمولات'],
'{"payment_gateway": "Geidea", "wallet_system": "dual", "min_withdrawal": 100}'::jsonb),

('foundation', 'نظام المتاجر والتخصيص',
'كل مسوق لديه affiliate_store بـ store_slug فريد. المتجر يدعم: themes (قوالب)، hero banners، featured categories، custom pages (CMS)، coupons، store_settings. العميل يصل للمتجر عبر /store/{slug}. المسوق يتحكم بمظهر متجره وأسعاره الخاصة عبر affiliate_products.',
8, ARRAY['متاجر', 'تخصيص', 'CMS'],
'{"customization": ["themes", "banners", "pages", "coupons"], "access": "/store/{slug}"}'::jsonb),

('foundation', 'نظام الشحن والتوصيل',
'الشحن يُدار عبر shipments وshipment_events. الحالات: PENDING → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED. كل حدث يُسجل في shipment_events للتتبع. عند التسليم، تُؤكد العمولات تلقائياً عبر trigger. يوجد shipping_providers للربط مع شركات الشحن.',
7, ARRAY['شحن', 'توصيل', 'تتبع'],
'{"statuses": ["PENDING", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"], "auto_confirm": true}'::jsonb),

('foundation', 'نظام الدردشة والتواصل',
'يوجد نظامان للدردشة: 1) Atlantis Chat (chat_rooms + chat_messages + room_members) - للمجتمع العام، غرف عامة وخاصة، يدعم التفاعلات والإشارات. 2) Customer Service Chat - للتواصل بين العميل وصاحب المتجر. FloatingAIChat للمسوقين والتجار. DraggableChatButton للعملاء في المتاجر.',
8, ARRAY['دردشة', 'تواصل', 'مجتمع'],
'{"systems": ["atlantis_chat", "customer_service"], "ai_assistant": true}'::jsonb),

('foundation', 'نظام الإشعارات والتنبيهات',
'يوجد smart_notifications للإشعارات الذكية، push_subscriptions للإشعارات المباشرة، stock_alerts لتنبيهات توفر المنتجات. Toast notifications عبر sonner. Email campaigns عبر email_campaigns.',
6, ARRAY['إشعارات', 'تنبيهات'],
'{"types": ["smart", "push", "stock", "toast", "email"]}'::jsonb),

('foundation', 'قواعد الأمان المطبقة',
'RLS policies على جميع الجداول الحساسة. الأدوار في جدول منفصل. دوال SECURITY DEFINER للعمليات الحساسة. تشفير كلمات المرور. OTP للتحقق. 2FA متاح. audit logs للعمليات الحساسة. منع SQL injection عبر Supabase client.',
9, ARRAY['أمان', 'RLS', 'تشفير'],
'{"security_measures": ["RLS", "separate_roles", "security_definer", "OTP", "2FA", "audit_logs"]}'::jsonb),

('foundation', 'قرارات التصميم المهمة',
'نظام التصميم Anaqati: feminine luxury aesthetic. الألوان: maroon #5A2647 (primary)، pink #F4C2C2 (secondary)، gold #C89B3C (accent). الخطوط: عربية أنيقة. RTL direction. Responsive design. Dark/Light mode support. جميع الألوان عبر CSS variables وليس hardcoded.',
8, ARRAY['تصميم', 'Anaqati', 'UI'],
'{"theme": "Anaqati", "colors": {"primary": "#5A2647", "secondary": "#F4C2C2", "accent": "#C89B3C"}, "direction": "RTL"}'::jsonb),

('foundation', 'التكاملات الخارجية',
'Geidea: بوابة الدفع السعودية. Zoho Books: الفواتير الإلكترونية (webhook integration). LiveKit: مؤتمرات الفيديو والصوت. Firebase: Push notifications. OpenAI/Lovable AI: الذكاء الاصطناعي. لا يوجد تكامل Stripe حالياً.',
7, ARRAY['تكاملات', 'APIs'],
'{"integrations": ["Geidea", "Zoho", "LiveKit", "Firebase", "AI"]}'::jsonb),

('foundation', 'الصفحات والمسارات الرئيسية',
'المسارات الرئيسية: / (الصفحة الرئيسية)، /admin/* (لوحة الإدارة)، /affiliate/* (لوحة المسوق)، /merchant/* (لوحة التاجر)، /store/{slug} (متجر المسوق)، /atlantis/* (نظام التيمات)، /meeting-hall (قاعة الاجتماعات)، /ai-studio (استوديو الذكاء الاصطناعي).',
7, ARRAY['مسارات', 'صفحات', 'routing'],
'{"main_routes": ["/", "/admin", "/affiliate", "/merchant", "/store", "/atlantis", "/meeting-hall", "/ai-studio"]}'::jsonb);

-- 2. إضافة أنماط المعرفة
INSERT INTO brain_patterns (pattern_type, pattern_name, description, detection_rules, confidence_score, is_active) VALUES
('knowledge', 'معرفة بنية المشروع', 'العقل يفهم كيف تم بناء المشروع من الصفر', 
'{"source": "foundation_memories", "coverage": "complete"}'::jsonb, 0.95, true),
('knowledge', 'معرفة الأنظمة الأساسية', 'العقل يفهم جميع الأنظمة: التجارة، التيمات، الدفع، الشحن، الدردشة', 
'{"systems": ["commerce", "gamification", "payment", "shipping", "chat"]}'::jsonb, 0.95, true),
('knowledge', 'معرفة القرارات التصميمية', 'العقل يفهم لماذا تم اختيار كل تقنية وتصميم', 
'{"decisions": ["tech_stack", "design_system", "security", "architecture"]}'::jsonb, 0.9, true);