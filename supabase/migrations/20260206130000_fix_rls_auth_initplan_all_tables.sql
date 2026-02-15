-- ============================================
-- Fix Auth RLS Init Plan (Performance) - كل الجداول من الـ migrations
-- استبدال auth.uid() بـ (select auth.uid()) و auth.jwt() بـ (select auth.jwt())
-- مُولّد تلقائياً بـ: node scripts/fix-rls-auth-initplan.mjs
-- ============================================

DROP POLICY IF EXISTS "Users can view their own store categories" ON public.affiliate_store_categories;
DROP POLICY IF EXISTS "Users can insert their own store categories" ON public.affiliate_store_categories;
DROP POLICY IF EXISTS "Users can update their own store categories" ON public.affiliate_store_categories;
DROP POLICY IF EXISTS "Users can delete their own store categories" ON public.affiliate_store_categories;
DROP POLICY IF EXISTS "Users can view product categories for their stores" ON public.affiliate_product_categories;
DROP POLICY IF EXISTS "Users can insert product categories for their stores" ON public.affiliate_product_categories;
DROP POLICY IF EXISTS "Users can delete product categories for their stores" ON public.affiliate_product_categories;
DROP POLICY IF EXISTS "affiliates_view_own_withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "affiliates_create_own_withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "affiliates_update_own_pending_withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "admins_view_all_withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "admins_update_all_withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "admins_delete_withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "affiliate_select_own_store" ON public.affiliate_stores;
DROP POLICY IF EXISTS "affiliate_insert_own_store" ON public.affiliate_stores;
DROP POLICY IF EXISTS "affiliate_update_own_store" ON public.affiliate_stores;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can join channels" ON public.channel_members;
DROP POLICY IF EXISTS "Users can update their own membership" ON public.channel_members;
DROP POLICY IF EXISTS "Users can create channels" ON public.channels;
DROP POLICY IF EXISTS "Users can create new channels" ON public.channels;
DROP POLICY IF EXISTS "Admins can manage bans" ON public.user_bans;
DROP POLICY IF EXISTS "Admins can manage mutes" ON public.user_mutes;
DROP POLICY IF EXISTS "Admins can manage locks" ON public.channel_locks;
DROP POLICY IF EXISTS "Users can view their bans" ON public.user_bans;
DROP POLICY IF EXISTS "Users can view their mutes" ON public.user_mutes;
DROP POLICY IF EXISTS "Users can send messages to channels they are members of" ON public.messages;
DROP POLICY IF EXISTS "Authenticated can create bans" ON public.user_bans;
DROP POLICY IF EXISTS "Authenticated can create mutes" ON public.user_mutes;
DROP POLICY IF EXISTS "Authenticated can create locks" ON public.channel_locks;
DROP POLICY IF EXISTS "users_view_own_shop_payments" ON public.payments;
DROP POLICY IF EXISTS "admins_view_all_payments" ON public.payments;
DROP POLICY IF EXISTS "users_update_own_shop_payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view event_log" ON public.event_log;
DROP POLICY IF EXISTS "Users can view own points_events" ON public.points_events;
DROP POLICY IF EXISTS "Admins can view all points_events" ON public.points_events;
DROP POLICY IF EXISTS "Merchant owners can manage merchants" ON public.merchants;
DROP POLICY IF EXISTS "Moderators can create bans" ON public.user_bans;
DROP POLICY IF EXISTS "Moderators can create mutes" ON public.user_mutes;
DROP POLICY IF EXISTS "Moderators can create locks" ON public.channel_locks;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can create order_items" ON public.order_items;
DROP POLICY IF EXISTS "System can create commissions" ON public.commissions;
DROP POLICY IF EXISTS "self_read_profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view messages in channels they are members of" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view orders for their shops" ON public.orders;
DROP POLICY IF EXISTS "Users can view order_items for their shops" ON public.order_items;
DROP POLICY IF EXISTS "Users can view own commissions" ON public.commissions;
DROP POLICY IF EXISTS "Users can view commission payouts" ON public.commission_payouts;
DROP POLICY IF EXISTS "Merchant can manage products" ON public.products;
DROP POLICY IF EXISTS "Library owner can manage product_library" ON public.product_library;
DROP POLICY IF EXISTS "Shop owner can manage shops" ON public.shops;
DROP POLICY IF EXISTS "Users can view own shop payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update own shop payments" ON public.payments;
DROP POLICY IF EXISTS "Moderators and affected users can view bans" ON public.user_bans;
DROP POLICY IF EXISTS "Moderators and affected users can view mutes" ON public.user_mutes;
DROP POLICY IF EXISTS "Users can view members of their channels" ON public.channel_members;
DROP POLICY IF EXISTS "Only service role can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Shop owners can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Shop owners can update their orders" ON public.orders;
DROP POLICY IF EXISTS "Shop owners can view their order items" ON public.order_items;
DROP POLICY IF EXISTS "Shop owners can update their order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can leave channels" ON public.channel_members;
DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can view their own OTP codes" ON public.whatsapp_otp;
DROP POLICY IF EXISTS "Service role can manage OTP codes" ON public.whatsapp_otp;
DROP POLICY IF EXISTS "Shop owners can create shops" ON public.shops;
DROP POLICY IF EXISTS "Shop owners can update shops" ON public.shops;
DROP POLICY IF EXISTS "Shop owners can delete shops" ON public.shops;
DROP POLICY IF EXISTS "Merchant can manage product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Shop owners can manage their store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Shop owners can insert store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Shop owners can update store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Users can read own profile by phone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert profile by phone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile by phone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own activities" ON public.user_activities;
DROP POLICY IF EXISTS "System can insert activities" ON public.user_activities;
DROP POLICY IF EXISTS "Shop owners can manage settings" ON public.shop_settings_extended;
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can create own activities" ON public.user_activities;
DROP POLICY IF EXISTS "Shop owners can manage extended settings" ON public.shop_settings_extended;
DROP POLICY IF EXISTS "Shop owners can manage products" ON public.products;
DROP POLICY IF EXISTS "Users can read own complete profile" ON public.profiles;
DROP POLICY IF EXISTS "Limited public profile access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Anyone can create profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Affiliates can manage their own stores" ON public.affiliate_stores;
DROP POLICY IF EXISTS "Admins can manage order reviews" ON public.admin_order_reviews;
DROP POLICY IF EXISTS "Merchants can view their forwarded orders" ON public.admin_order_reviews;
DROP POLICY IF EXISTS "Shop owners can manage their invoices" ON public.invoices;
DROP POLICY IF EXISTS "Shop owners can manage their invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Shop owners can manage their payment gateways" ON public.payment_gateways;
DROP POLICY IF EXISTS "Shop owners can view their payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Only service role can insert payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Shop owners can manage their refunds" ON public.refunds;
DROP POLICY IF EXISTS "Shop owners can manage their refund items" ON public.refund_items;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their initial role" ON public.user_roles;
DROP POLICY IF EXISTS "Shop owners can manage their shipments" ON public.shipments;
DROP POLICY IF EXISTS "Shop owners can view their shipment tracking" ON public.shipment_tracking;
DROP POLICY IF EXISTS "Shop owners can manage their warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Warehouse access for inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Warehouse access for inventory movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "Warehouse access for inventory reservations" ON public.inventory_reservations;
DROP POLICY IF EXISTS "Warehouse access for stock alerts" ON public.stock_alerts;
DROP POLICY IF EXISTS "Shop owners can manage security settings" ON public.security_settings;
DROP POLICY IF EXISTS "Shop owners can manage social media accounts" ON public.social_media_accounts;
DROP POLICY IF EXISTS "Shop owners can manage social media posts" ON public.social_media_posts;
DROP POLICY IF EXISTS "Shop owners can manage email campaigns" ON public.email_campaigns;
DROP POLICY IF EXISTS "Shop owners can manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Customers can use coupons" ON public.coupon_usage;
DROP POLICY IF EXISTS "Shop owners can view coupon usage" ON public.coupon_usage;
DROP POLICY IF EXISTS "Shop owners can manage loyalty tiers" ON public.loyalty_tiers;
DROP POLICY IF EXISTS "Customers can view their loyalty points" ON public.customer_loyalty;
DROP POLICY IF EXISTS "Shop owners can manage customer loyalty" ON public.customer_loyalty;
DROP POLICY IF EXISTS "Customers can view their loyalty transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Shop system can manage loyalty transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Shop owners can manage loyalty rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Customers can view and redeem rewards" ON public.loyalty_redemptions;
DROP POLICY IF EXISTS "Product owners can manage product images" ON public.product_images;
DROP POLICY IF EXISTS "Product owners can manage product attributes" ON public.product_attributes;
DROP POLICY IF EXISTS "Users can manage their shipping addresses" ON public.shipping_addresses;
DROP POLICY IF EXISTS "Users can manage their shopping cart" ON public.shopping_carts;
DROP POLICY IF EXISTS "Users can manage their cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Customers can view their orders" ON public.ecommerce_orders;
DROP POLICY IF EXISTS "Shop owners can manage their shop orders" ON public.ecommerce_orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.ecommerce_orders;
DROP POLICY IF EXISTS "Customers can view their order items" ON public.ecommerce_order_items;
DROP POLICY IF EXISTS "Shop owners can manage their order items" ON public.ecommerce_order_items;
DROP POLICY IF EXISTS "Authenticated users can add order items" ON public.ecommerce_order_items;
DROP POLICY IF EXISTS "Customers can view their order status history" ON public.order_status_history;
DROP POLICY IF EXISTS "Shop owners and admins can manage order status history" ON public.order_status_history;
DROP POLICY IF EXISTS "Affiliates can view their order tracking" ON public.order_tracking;
DROP POLICY IF EXISTS "System can create order tracking" ON public.order_tracking;
DROP POLICY IF EXISTS "System can update order tracking" ON public.order_tracking;
DROP POLICY IF EXISTS "Users can manage their own carts" ON public.shopping_carts;
DROP POLICY IF EXISTS "Users can create carts" ON public.shopping_carts;
DROP POLICY IF EXISTS "Users can manage cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can view their orders" ON public.simple_orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.simple_orders;
DROP POLICY IF EXISTS "Users can view order items" ON public.simple_order_items;
DROP POLICY IF EXISTS "Users can create order items" ON public.simple_order_items;
DROP POLICY IF EXISTS "Users can access carts" ON public.shopping_carts;
DROP POLICY IF EXISTS "Users can access cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Shop owners can manage shipments" ON public.shipments;
DROP POLICY IF EXISTS "Customers can view their shipments" ON public.shipments;
DROP POLICY IF EXISTS "Shop owners manage shipments tracking" ON public.shipments_tracking;
DROP POLICY IF EXISTS "Customers view their shipments tracking" ON public.shipments_tracking;
DROP POLICY IF EXISTS "Shop owners manage shipment events" ON public.shipment_events;
DROP POLICY IF EXISTS "Customers view their shipment events" ON public.shipment_events;
DROP POLICY IF EXISTS "Shop owners manage store shipping config" ON public.store_shipping_config;
DROP POLICY IF EXISTS "Customers can view their own data" ON public.customers;
DROP POLICY IF EXISTS "Customers can update their own data" ON public.customers;
DROP POLICY IF EXISTS "Store owners can view their customers" ON public.store_customers;
DROP POLICY IF EXISTS "Customers can view their store relationships" ON public.store_customers;
DROP POLICY IF EXISTS "Store owners and customers can update relationships" ON public.store_customers;
DROP POLICY IF EXISTS "Customers can manage their addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Users can update own level" ON public.user_levels;
DROP POLICY IF EXISTS "System can manage levels" ON public.user_levels;
DROP POLICY IF EXISTS "Leaders can manage their alliance" ON public.alliances;
DROP POLICY IF EXISTS "Affiliates can create alliances" ON public.alliances;
DROP POLICY IF EXISTS "Users can join/leave alliances" ON public.alliance_members;
DROP POLICY IF EXISTS "Alliance leaders can manage participations" ON public.challenge_participations;
DROP POLICY IF EXISTS "System can manage castle control" ON public.castle_control;
DROP POLICY IF EXISTS "System can manage weekly leaderboard" ON public.weekly_leaderboard;
DROP POLICY IF EXISTS "System can manage monthly leaderboard" ON public.monthly_leaderboard;
DROP POLICY IF EXISTS "System can manage alliance leaderboard" ON public.alliance_weekly_leaderboard;
DROP POLICY IF EXISTS "Users can view own themes" ON public.user_themes;
DROP POLICY IF EXISTS "System can manage themes" ON public.user_themes;
DROP POLICY IF EXISTS "Users can create reports" ON public.alliance_reports;
DROP POLICY IF EXISTS "Users can view own reports" ON public.alliance_reports;
DROP POLICY IF EXISTS "Users can view public rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Room owners can manage their rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can join public rooms" ON public.room_members;
DROP POLICY IF EXISTS "Room members can leave" ON public.room_members;
DROP POLICY IF EXISTS "Room members can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Room members can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can edit their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Room members can manage reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can view their own chat points" ON public.atlantis_chat_points;
DROP POLICY IF EXISTS "Inventory staff can manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Inventory staff can manage warehouse products" ON public.warehouse_products;
DROP POLICY IF EXISTS "Affiliates can view active warehouse products" ON public.warehouse_products;
DROP POLICY IF EXISTS "Inventory staff can manage product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Affiliates can view active product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Inventory staff can manage inventory movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "Inventory staff can manage returns" ON public.product_returns;
DROP POLICY IF EXISTS "Inventory staff can manage return items" ON public.return_items;
DROP POLICY IF EXISTS "Users can view relevant alerts" ON public.inventory_alerts;
DROP POLICY IF EXISTS "Users can update alert read status" ON public.inventory_alerts;
DROP POLICY IF EXISTS "Authenticated users can manage warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Authenticated users can manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can manage warehouse products" ON public.warehouse_products;
DROP POLICY IF EXISTS "Authenticated users can manage product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Authenticated users can manage inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Authenticated users can create inventory movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "Authenticated users can manage inventory alerts" ON public.inventory_alerts;
DROP POLICY IF EXISTS "Authenticated users can manage inventory reservations" ON public.inventory_reservations;
DROP POLICY IF EXISTS "Allow authenticated users to create their own levels" ON public.user_levels;
DROP POLICY IF EXISTS "Allow system and admins to manage all levels" ON public.user_levels;
DROP POLICY IF EXISTS "Users can update their own levels" ON public.user_levels;
DROP POLICY IF EXISTS "select own affiliate store" ON public.affiliate_stores;
DROP POLICY IF EXISTS "insert own affiliate store" ON public.affiliate_stores;
DROP POLICY IF EXISTS "update own affiliate store" ON public.affiliate_stores;

DROP POLICY IF EXISTS "affiliates see their store orders" ON public.orders;
DROP POLICY IF EXISTS "affiliate sees own commissions" ON public.commissions;

DROP POLICY IF EXISTS "affiliate_view_store_orders" ON public.orders;
DROP POLICY IF EXISTS "affiliate_view_own_commissions" ON public.commissions;
DROP POLICY IF EXISTS "authenticated_users_can_view_own_orders" ON public.orders;
DROP POLICY IF EXISTS "authenticated_users_can_view_own_order_items" ON public.order_items;
DROP POLICY IF EXISTS "authenticated_users_can_view_related_orders" ON public.orders;
DROP POLICY IF EXISTS "authenticated_users_can_view_related_order_items" ON public.order_items;
DROP POLICY IF EXISTS "cart_store_scoped_access" ON public.shopping_carts;
DROP POLICY IF EXISTS "cart_items_store_scoped" ON public.cart_items;
DROP POLICY IF EXISTS "cart_items_enhanced_access" ON public.cart_items;
DROP POLICY IF EXISTS "Product owners can manage variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can manage variant options" ON public.product_variant_options;
DROP POLICY IF EXISTS "Store owners can manage their customers" ON public.store_customers;
DROP POLICY IF EXISTS "Store owners can manage their store themes" ON public.affiliate_store_themes;
DROP POLICY IF EXISTS "Store owners can view their store themes" ON public.affiliate_store_themes;
DROP POLICY IF EXISTS "Users can view their own custom themes" ON public.user_custom_themes;
DROP POLICY IF EXISTS "Users can create their own custom themes" ON public.user_custom_themes;
DROP POLICY IF EXISTS "Users can update their own custom themes" ON public.user_custom_themes;
DROP POLICY IF EXISTS "Users can view their theme analytics" ON public.theme_usage_analytics;
DROP POLICY IF EXISTS "Users can insert their theme analytics" ON public.theme_usage_analytics;
DROP POLICY IF EXISTS "Store owners can manage their banners" ON public.promotional_banners;
DROP POLICY IF EXISTS "Store owners can manage their campaigns" ON public.promotion_campaigns;
DROP POLICY IF EXISTS "Store owners can view their banner analytics" ON public.banner_analytics;
DROP POLICY IF EXISTS "Store owners can manage campaign banners" ON public.campaign_banners;
DROP POLICY IF EXISTS "Store owners can manage their pages" ON public.store_pages;
DROP POLICY IF EXISTS "Store owners can create custom templates" ON public.page_templates;
DROP POLICY IF EXISTS "Store owners can manage their content sections" ON public.content_sections;
DROP POLICY IF EXISTS "Store owners can manage content blocks" ON public.content_blocks;
DROP POLICY IF EXISTS "Store owners can manage their media" ON public.media_library;
DROP POLICY IF EXISTS "Store owners can manage their forms" ON public.custom_forms;
DROP POLICY IF EXISTS "Store owners can view their form submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Store owners can manage bundle offers" ON public.bundle_offers;
DROP POLICY IF EXISTS "Store owners can manage customer segments" ON public.customer_segments;
DROP POLICY IF EXISTS "Store owners can view campaign usage" ON public.campaign_usage;
DROP POLICY IF EXISTS "Store owners can manage seasonal campaigns" ON public.seasonal_campaigns;
DROP POLICY IF EXISTS "Store owners can manage marketing campaigns" ON public.marketing_automation_campaigns;
DROP POLICY IF EXISTS "Store owners can manage leads" ON public.leads;
DROP POLICY IF EXISTS "Store owners can view lead activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Store owners can create lead activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Store owners can view analytics events" ON public.advanced_analytics_events;
DROP POLICY IF EXISTS "Store owners can manage customer journey" ON public.customer_journey_steps;
DROP POLICY IF EXISTS "Users can view their notifications" ON public.smart_notifications;
DROP POLICY IF EXISTS "Store owners can send notifications" ON public.smart_notifications;
DROP POLICY IF EXISTS "Store owners can manage behavioral triggers" ON public.behavioral_triggers;
DROP POLICY IF EXISTS "Store owners can view predictive insights" ON public.predictive_insights;
DROP POLICY IF EXISTS "Store owners can manage their pages" ON public.cms_custom_pages;
DROP POLICY IF EXISTS "Store owners can manage page widgets" ON public.cms_content_widgets;
DROP POLICY IF EXISTS "Store owners can view page SEO analytics" ON public.cms_seo_analytics;
DROP POLICY IF EXISTS "Store owners can view page revisions" ON public.cms_page_revisions;
DROP POLICY IF EXISTS "Store owners can create page revisions" ON public.cms_page_revisions;
DROP POLICY IF EXISTS "Store owners can manage page elements" ON public.page_builder_elements;
DROP POLICY IF EXISTS "Users can manage their own components" ON public.saved_page_components;
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.page_builder_sessions;
DROP POLICY IF EXISTS "Users can manage their own drafts" ON public.content_editor_drafts;
DROP POLICY IF EXISTS "Store owners can manage visual themes" ON public.visual_theme_customizations;
DROP POLICY IF EXISTS "Store owners can manage interactive elements" ON public.interactive_elements;
DROP POLICY IF EXISTS "Users can manage their product media" ON public.product_media;
DROP POLICY IF EXISTS "Users can manage their product discounts" ON public.product_discounts;
DROP POLICY IF EXISTS "Users can manage their product variants" ON public.product_variants_advanced;
DROP POLICY IF EXISTS "Users can manage their product SEO" ON public.product_seo;
DROP POLICY IF EXISTS "Users can manage their product shipping" ON public.product_shipping;
DROP POLICY IF EXISTS "Users can view their permissions" ON public.product_permissions;
DROP POLICY IF EXISTS "Users can view their activity log" ON public.product_activity_log;
DROP POLICY IF EXISTS "Users can manage products through shops" ON public.products;
DROP POLICY IF EXISTS "Secure profile access" ON public.profiles;
DROP POLICY IF EXISTS "Secure cart items access" ON public.cart_items;
DROP POLICY IF EXISTS "Store owners can manage their settings" ON public.affiliate_store_settings;
DROP POLICY IF EXISTS "Anyone can read their own cart" ON public.shopping_carts;
DROP POLICY IF EXISTS "Anyone can create cart" ON public.shopping_carts;
DROP POLICY IF EXISTS "Anyone can update their own cart" ON public.shopping_carts;
DROP POLICY IF EXISTS "Anyone can read their cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Anyone can add items to their cart" ON public.cart_items;
DROP POLICY IF EXISTS "Anyone can update their cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Anyone can delete their cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Affiliates can view their store orders" ON public.ecommerce_orders;
DROP POLICY IF EXISTS "Affiliates can view their store order items" ON public.ecommerce_order_items;
DROP POLICY IF EXISTS "Affiliates can manage their coupons" ON public.affiliate_coupons;
DROP POLICY IF EXISTS "Affiliates can view coupon usage" ON public.affiliate_coupon_usage;
DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can create own withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "المسوقون يمكنهم عرض طلبات السحب الخاصة بهم" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "المسوقون يمكنهم إنشاء طلبات سحب" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Merchants can view own products" ON public.products;
DROP POLICY IF EXISTS "Merchants can insert products" ON public.products;
DROP POLICY IF EXISTS "Merchants can update own pending products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
DROP POLICY IF EXISTS "Users can view own payment info" ON public.affiliate_payment_info;
DROP POLICY IF EXISTS "Users can insert own payment info" ON public.affiliate_payment_info;
DROP POLICY IF EXISTS "Users can update own payment info" ON public.affiliate_payment_info;
DROP POLICY IF EXISTS "Merchants can insert own merchant record" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can view own merchant record" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can update own merchant record" ON public.merchants;
DROP POLICY IF EXISTS "Store owners can view their banners" ON public.store_banners;
DROP POLICY IF EXISTS "Store owners can manage their banners" ON public.store_banners;
DROP POLICY IF EXISTS "Authenticated users can vote on reviews" ON public.review_votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON public.review_votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON public.review_votes;
DROP POLICY IF EXISTS "Customers can view their own customer service chats" ON public.chat_rooms;
DROP POLICY IF EXISTS "Store owners can view their store's customer service chats" ON public.chat_rooms;
DROP POLICY IF EXISTS "Authenticated users can create customer service chats" ON public.chat_rooms;
DROP POLICY IF EXISTS "Merchants can view orders with their products" ON public.ecommerce_orders;
DROP POLICY IF EXISTS "Merchants can view their product order items" ON public.ecommerce_order_items;
DROP POLICY IF EXISTS "Merchants can update order status" ON public.ecommerce_orders;
DROP POLICY IF EXISTS "Service can create customer profiles via OTP" ON public.profiles;
DROP POLICY IF EXISTS "Affiliates can view their orders" ON public.order_hub;
DROP POLICY IF EXISTS "Merchants can view their shop orders" ON public.order_hub;
DROP POLICY IF EXISTS "Users can view shipment history for their orders" ON public.shipment_status_history;
DROP POLICY IF EXISTS "Shop owners can view their orders" ON public.order_hub;
DROP POLICY IF EXISTS "System can insert reports" ON public.data_quality_report;
DROP POLICY IF EXISTS "Users can select own profile" ON public.profiles;
DROP POLICY IF EXISTS "profile_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profile_update_own" ON public.profiles;
DROP POLICY IF EXISTS "Users view their wallet transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users view their wallet balance" ON public.wallet_balances;
DROP POLICY IF EXISTS "Users view their returns" ON public.order_returns;
DROP POLICY IF EXISTS "Users view their withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users create their withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Merchants view own wallet" ON public.merchant_wallet_balances;
DROP POLICY IF EXISTS "Admins view all wallets" ON public.merchant_wallet_balances;
DROP POLICY IF EXISTS "Merchants view own transactions" ON public.merchant_transactions;
DROP POLICY IF EXISTS "Admins view all transactions" ON public.merchant_transactions;
DROP POLICY IF EXISTS "Merchants view own withdrawals" ON public.merchant_withdrawal_requests;
DROP POLICY IF EXISTS "Merchants create own withdrawals" ON public.merchant_withdrawal_requests;
DROP POLICY IF EXISTS "Admins manage all withdrawals" ON public.merchant_withdrawal_requests;
DROP POLICY IF EXISTS "Admins view all revenue" ON public.platform_revenue;
DROP POLICY IF EXISTS "Merchants view own revenue" ON public.platform_revenue;
DROP POLICY IF EXISTS "Affiliates view own wallet" ON public.wallet_balances;
DROP POLICY IF EXISTS "Affiliates create own wallet" ON public.wallet_balances;
DROP POLICY IF EXISTS "Affiliates update own wallet" ON public.wallet_balances;
DROP POLICY IF EXISTS "Merchants create own wallet" ON public.merchant_wallet_balances;
DROP POLICY IF EXISTS "Merchants update own wallet" ON public.merchant_wallet_balances;
DROP POLICY IF EXISTS "Admins manage all affiliate wallets" ON public.wallet_balances;
DROP POLICY IF EXISTS "Admins manage all merchant wallets" ON public.merchant_wallet_balances;
DROP POLICY IF EXISTS "Affiliates can view their own subscriptions" ON public.affiliate_subscriptions;
DROP POLICY IF EXISTS "Affiliates can create their own subscriptions" ON public.affiliate_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.affiliate_subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.affiliate_subscriptions;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Affiliates view own payment info" ON public.affiliate_payment_info;
DROP POLICY IF EXISTS "Affiliates update own payment info" ON public.affiliate_payment_info;
DROP POLICY IF EXISTS "Affiliates insert own payment info" ON public.affiliate_payment_info;
DROP POLICY IF EXISTS "Admins view all payment info" ON public.affiliate_payment_info;
DROP POLICY IF EXISTS "Users can view own OTP sessions" ON public.customer_otp_sessions;
DROP POLICY IF EXISTS "Service role can manage OTP sessions" ON public.customer_otp_sessions;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "Store owners can view their alerts" ON public.stock_alerts;
DROP POLICY IF EXISTS "Store owners can manage their alerts" ON public.stock_alerts;
DROP POLICY IF EXISTS "Room creators can view their rooms" ON public.meeting_rooms;
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.meeting_rooms;
DROP POLICY IF EXISTS "Room creators can update their rooms" ON public.meeting_rooms;
DROP POLICY IF EXISTS "Anyone can view participants of rooms they can access" ON public.meeting_participants;
DROP POLICY IF EXISTS "Authenticated users can join rooms" ON public.meeting_participants;
DROP POLICY IF EXISTS "Participants can update their own record" ON public.meeting_participants;
DROP POLICY IF EXISTS "Users can manage their brain conversations" ON public.brain_conversations;
DROP POLICY IF EXISTS "Admins can manage apps" ON public.marketplace_apps;
DROP POLICY IF EXISTS "Store owners can view their installed apps" ON public.installed_apps;
DROP POLICY IF EXISTS "Store owners can manage their apps" ON public.installed_apps;
DROP POLICY IF EXISTS "App owners can manage their API keys" ON public.app_api_keys;
DROP POLICY IF EXISTS "App owners can manage their webhooks" ON public.app_webhooks;
DROP POLICY IF EXISTS "Users can manage their own reviews" ON public.app_reviews;
DROP POLICY IF EXISTS "Developers can manage their own apps" ON public.marketplace_apps;
DROP POLICY IF EXISTS "Store owners can install apps" ON public.installed_apps;
DROP POLICY IF EXISTS "Store owners can update their installed apps" ON public.installed_apps;
DROP POLICY IF EXISTS "Store owners can uninstall apps" ON public.installed_apps;
DROP POLICY IF EXISTS "Store owners can manage their API keys" ON public.app_api_keys;
DROP POLICY IF EXISTS "Store owners can manage their webhooks" ON public.app_webhooks;
DROP POLICY IF EXISTS "Store owners can view their webhook logs" ON public.app_webhook_logs;
DROP POLICY IF EXISTS "Store owners can create reviews" ON public.app_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.app_reviews;
DROP POLICY IF EXISTS "Store owners can manage their events" ON public.app_events;
DROP POLICY IF EXISTS "Users can view own agreements" ON public.affiliate_agreements;
DROP POLICY IF EXISTS "Users can create own agreements" ON public.affiliate_agreements;
DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.user_wishlists;
DROP POLICY IF EXISTS "Users can add to their own wishlist" ON public.user_wishlists;
DROP POLICY IF EXISTS "Users can remove from their own wishlist" ON public.user_wishlists;
DROP POLICY IF EXISTS "Users can view their own compare list" ON public.user_compare_lists;
DROP POLICY IF EXISTS "Users can add to their own compare list" ON public.user_compare_lists;
DROP POLICY IF EXISTS "Users can remove from their own compare list" ON public.user_compare_lists;
DROP POLICY IF EXISTS "Users can view own level" ON public.atlantis_user_levels;
DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
DROP POLICY IF EXISTS "System can manage badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can view their own level" ON public.atlantis_user_levels;
DROP POLICY IF EXISTS "Anyone can view active badges" ON public.badges;
DROP POLICY IF EXISTS "Admins can manage badges" ON public.badges;
DROP POLICY IF EXISTS "Users can view their own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Merchants can view their own pending balance" ON public.merchant_pending_balance;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- معطل: جدول affiliate_store_categories لا يملك عمود affiliate_store_id في الـ schema الحالي
-- CREATE POLICY "Users can view/insert/update/delete their own store categories" ON affiliate_store_categories ...
-- CREATE POLICY "Users can view/insert/delete product categories for their stores" ON affiliate_product_categories ...

CREATE POLICY "affiliates_view_own_withdrawals"
  ON public.withdrawal_requests
  FOR SELECT
  USING (
    affiliate_profile_id IN (
      SELECT id FROM public.profiles 
      WHERE auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "affiliates_create_own_withdrawals"
  ON public.withdrawal_requests
  FOR INSERT
  WITH CHECK (
    affiliate_profile_id IN (
      SELECT id FROM public.profiles 
      WHERE auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "affiliates_update_own_pending_withdrawals"
  ON public.withdrawal_requests
  FOR UPDATE
  USING (
    affiliate_profile_id IN (
      SELECT id FROM public.profiles 
      WHERE auth_user_id = (select auth.uid())
    )
    AND status = 'PENDING'
  )
  WITH CHECK (
    affiliate_profile_id IN (
      SELECT id FROM public.profiles 
      WHERE auth_user_id = (select auth.uid())
    )
    AND status = 'PENDING'
  );

CREATE POLICY "admins_view_all_withdrawals"
  ON public.withdrawal_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE auth_user_id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

CREATE POLICY "admins_update_all_withdrawals"
  ON public.withdrawal_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE auth_user_id = (select auth.uid()) 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE auth_user_id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

CREATE POLICY "admins_delete_withdrawals"
  ON public.withdrawal_requests
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE auth_user_id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

create policy "affiliate_select_own_store"
on public.affiliate_stores for select
using (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())) OR is_active = true);

create policy "affiliate_insert_own_store"
on public.affiliate_stores for insert
with check (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())));

create policy "affiliate_update_own_store"
on public.affiliate_stores for update
using (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())));

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can join channels" 
  ON public.channel_members 
  FOR INSERT 
  WITH CHECK (
    -- Allow users to join with their own profile ID
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = user_id AND p.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update their own membership" 
  ON public.channel_members 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = user_id AND p.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create channels"
ON channels FOR INSERT
TO authenticated
WITH CHECK (owner_id IN (
  SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())
));

CREATE POLICY "Users can create new channels" ON public.channels
  FOR INSERT 
  WITH CHECK (owner_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())));

CREATE POLICY "Admins can manage bans" ON user_bans
FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.auth_user_id = (select auth.uid()) 
    AND profiles.role IN ('admin', 'moderator')
));

CREATE POLICY "Admins can manage mutes" ON user_mutes
FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.auth_user_id = (select auth.uid()) 
    AND profiles.role IN ('admin', 'moderator')
));

CREATE POLICY "Admins can manage locks" ON channel_locks
FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.auth_user_id = (select auth.uid()) 
    AND profiles.role IN ('admin', 'moderator')
));

CREATE POLICY "Users can view their bans" ON user_bans
FOR SELECT TO authenticated
USING (user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())
));

CREATE POLICY "Users can view their mutes" ON user_mutes
FOR SELECT TO authenticated
USING (user_id IN (
    SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())
));

CREATE POLICY "Users can send messages to channels they are members of" ON public.messages
  FOR INSERT 
  WITH CHECK (
    sender_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())) 
    AND channel_id IN (
      SELECT cm.channel_id 
      FROM channel_members cm 
      JOIN profiles p ON p.id = cm.user_id 
      WHERE p.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Authenticated can create bans" ON user_bans FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated can create mutes" ON user_mutes FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated can create locks" ON channel_locks FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "users_view_own_shop_payments" ON public.payments
  FOR SELECT 
  USING (
    order_id IN (
      SELECT o.id 
      FROM orders o
      JOIN shops s ON s.id = o.shop_id
      JOIN profiles p ON p.id = s.owner_id
      WHERE p.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "admins_view_all_payments" ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

CREATE POLICY "users_update_own_shop_payments" ON public.payments
  FOR UPDATE
  USING (
    order_id IN (
      SELECT o.id 
      FROM orders o
      JOIN shops s ON s.id = o.shop_id
      JOIN profiles p ON p.id = s.owner_id
      WHERE p.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING ((select auth.uid()) = auth_user_id)
WITH CHECK ((select auth.uid()) = auth_user_id);

CREATE POLICY "Admins can view event_log" ON public.event_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can view own points_events" ON public.points_events
  FOR SELECT 
  USING (affiliate_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())));

CREATE POLICY "Admins can view all points_events" ON public.points_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

CREATE POLICY "Merchant owners can manage merchants" ON public.merchants
  FOR ALL 
  USING (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())));

CREATE POLICY "Moderators can create bans" ON public.user_bans
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = (select auth.uid()) 
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Moderators can create mutes" ON public.user_mutes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = (select auth.uid()) 
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Moderators can create locks" ON public.channel_locks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = (select auth.uid()) 
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Authenticated users can create orders" ON public.orders
  FOR INSERT 
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can create order_items" ON public.order_items
  FOR INSERT 
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "System can create commissions" ON public.commissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

CREATE POLICY "self_read_profile" ON public.profiles
  FOR SELECT 
  USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can view messages in channels they are members of" ON public.messages
  FOR SELECT 
  USING (channel_id IN (
    SELECT cm.channel_id 
    FROM channel_members cm 
    JOIN profiles p ON p.id = cm.user_id 
    WHERE p.auth_user_id = (select auth.uid())
  ));

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE 
  USING (sender_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())));

CREATE POLICY "Users can delete their own messages" ON public.messages
  FOR DELETE 
  USING (sender_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())));

CREATE POLICY "Users can view orders for their shops" ON public.orders
  FOR SELECT 
  USING (shop_id IN (
    SELECT s.id FROM shops s 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = (select auth.uid())
  ));

CREATE POLICY "Users can view order_items for their shops" ON public.order_items
  FOR SELECT 
  USING (order_id IN (
    SELECT o.id FROM orders o 
    JOIN shops s ON s.id = o.shop_id 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = (select auth.uid())
  ));

CREATE POLICY "Users can view own commissions" ON public.commissions
  FOR SELECT 
  USING (affiliate_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())));

CREATE POLICY "Users can view commission payouts" ON public.commission_payouts
  FOR SELECT 
  USING (affiliate_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())));

CREATE POLICY "Merchant can manage products" ON public.products
  FOR ALL 
  USING (merchant_id IN (
    SELECT m.id FROM merchants m 
    JOIN profiles p ON p.id = m.profile_id 
    WHERE p.auth_user_id = (select auth.uid())
  ));

CREATE POLICY "Library owner can manage product_library" ON public.product_library
  FOR ALL 
  USING (shop_id IN (
    SELECT s.id FROM shops s 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = (select auth.uid())
  ));

CREATE POLICY "Shop owner can manage shops" ON public.shops
  FOR ALL 
  USING (owner_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())));

CREATE POLICY "Users can view own shop payments" ON public.payments
  FOR SELECT 
  USING (order_id IN (
    SELECT o.id FROM orders o 
    JOIN shops s ON s.id = o.shop_id 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = (select auth.uid())
  ));

CREATE POLICY "Users can update own shop payments" ON public.payments
  FOR UPDATE 
  USING (order_id IN (
    SELECT o.id FROM orders o 
    JOIN shops s ON s.id = o.shop_id 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = (select auth.uid())
  ));

CREATE POLICY "Moderators and affected users can view bans" 
ON public.user_bans 
FOR SELECT 
USING (
  get_current_user_role() = ANY (ARRAY['admin'::text, 'moderator'::text])
  OR user_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid()))
);

CREATE POLICY "Moderators and affected users can view mutes"
ON public.user_mutes
FOR SELECT
USING (
  get_current_user_role() = ANY (ARRAY['admin'::text, 'moderator'::text])
  OR user_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid()))
);

CREATE POLICY "Users can view members of their channels"
ON public.channel_members
FOR SELECT
USING (
  channel_id IN (
    SELECT cm.channel_id 
    FROM channel_members cm
    JOIN profiles p ON p.id = cm.user_id
    WHERE p.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Only service role can insert payments"
ON public.payments
FOR INSERT
WITH CHECK ((select auth.jwt())->>'role' = 'service_role');

CREATE POLICY "Shop owners can view their orders" 
  ON public.orders 
  FOR SELECT 
  USING (
    shop_id IN (
      SELECT s.id 
      FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Shop owners can update their orders" 
  ON public.orders 
  FOR UPDATE 
  USING (
    shop_id IN (
      SELECT s.id 
      FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Shop owners can view their order items" 
  ON public.order_items 
  FOR SELECT 
  USING (
    order_id IN (
      SELECT o.id 
      FROM orders o
      JOIN shops s ON s.id = o.shop_id
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Shop owners can update their order items" 
  ON public.order_items 
  FOR UPDATE 
  USING (
    order_id IN (
      SELECT o.id 
      FROM orders o
      JOIN shops s ON s.id = o.shop_id
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can leave channels" 
  ON public.channel_members 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = user_id AND p.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can manage own push subscriptions" 
ON public.push_subscriptions 
FOR ALL 
USING (user_id IN (
  SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())
));

CREATE POLICY "Users can view their own OTP codes" 
ON public.whatsapp_otp 
FOR SELECT 
USING (phone IN (
  SELECT profiles.phone FROM profiles WHERE profiles.auth_user_id = (select auth.uid())
) OR user_id = (select auth.uid()));

CREATE POLICY "Service role can manage OTP codes" 
ON public.whatsapp_otp 
FOR ALL 
USING (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Shop owners can create shops"
ON public.shops
FOR INSERT
WITH CHECK (
  owner_id IN (
    SELECT p.id FROM public.profiles p
    WHERE p.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Shop owners can update shops"
ON public.shops
FOR UPDATE
USING (
  owner_id IN (
    SELECT p.id FROM public.profiles p
    WHERE p.auth_user_id = (select auth.uid())
  )
)
WITH CHECK (
  owner_id IN (
    SELECT p.id FROM public.profiles p
    WHERE p.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Shop owners can delete shops"
ON public.shops
FOR DELETE
USING (
  owner_id IN (
    SELECT p.id FROM public.profiles p
    WHERE p.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Merchant can manage product variants" 
ON public.product_variants 
FOR ALL 
USING (
  product_id IN (
    SELECT p.id 
    FROM products p
    JOIN merchants m ON m.id = p.merchant_id
    JOIN profiles pr ON pr.id = m.profile_id
    WHERE pr.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Shop owners can manage their store settings" 
ON public.store_settings 
FOR ALL
USING (shop_id IN (
  SELECT s.id 
  FROM shops s
  JOIN profiles p ON p.id = s.owner_id
  WHERE p.auth_user_id = (select auth.uid())
));

CREATE POLICY "Shop owners can insert store settings"
ON public.store_settings
FOR INSERT
WITH CHECK (shop_id IN (
  SELECT s.id 
  FROM shops s
  JOIN profiles p ON p.id = s.owner_id
  WHERE p.auth_user_id = (select auth.uid())
));

CREATE POLICY "Shop owners can update store settings"
ON public.store_settings
FOR UPDATE
USING (shop_id IN (
  SELECT s.id 
  FROM shops s
  JOIN profiles p ON p.id = s.owner_id
  WHERE p.auth_user_id = (select auth.uid())
));

CREATE POLICY "Users can read own profile by phone"
ON public.profiles
FOR SELECT
USING (
  ((select auth.uid()) = auth_user_id) OR (phone = public.get_current_user_phone())
);

CREATE POLICY "Users can insert profile by phone"
ON public.profiles
FOR INSERT
WITH CHECK (
  ((select auth.uid()) IS NOT NULL)
  AND (((select auth.uid()) = auth_user_id) OR (phone = public.get_current_user_phone()))
);

CREATE POLICY "Users can update own profile by phone"
ON public.profiles
FOR UPDATE
USING (
  ((select auth.uid()) = auth_user_id) OR (phone = public.get_current_user_phone())
)
WITH CHECK (
  ((select auth.uid()) = auth_user_id) OR (phone = public.get_current_user_phone())
);

CREATE POLICY "Users can view own activities" 
ON public.user_activities 
FOR SELECT 
USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = (select auth.uid())));

CREATE POLICY "System can insert activities" 
ON public.user_activities 
FOR INSERT 
WITH CHECK (user_id IN (
  SELECT id FROM public.profiles WHERE auth_user_id = (select auth.uid())
));

CREATE POLICY "Shop owners can manage settings" 
ON public.shop_settings_extended 
FOR ALL 
USING (shop_id IN (
  SELECT s.id FROM public.shops s 
  JOIN public.profiles p ON p.id = s.owner_id 
  WHERE p.auth_user_id = (select auth.uid())
));

CREATE POLICY "Users can manage own sessions" 
ON public.user_sessions 
FOR ALL 
USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = (select auth.uid())));

CREATE POLICY "Users can create own activities" 
ON public.user_activities 
FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = (select auth.uid())));

CREATE POLICY "Shop owners can manage extended settings" 
ON public.shop_settings_extended 
FOR ALL 
USING (shop_id IN (
    SELECT s.id FROM public.shops s 
    JOIN public.profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = (select auth.uid())
));

CREATE POLICY "Shop owners can manage products" 
ON public.products 
FOR ALL 
USING (
    shop_id IN (
        SELECT s.id FROM public.shops s 
        JOIN public.profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = (select auth.uid())
    ) OR 
    merchant_id IN (
        SELECT m.id FROM public.merchants m 
        JOIN public.profiles p ON p.id = m.profile_id 
        WHERE p.auth_user_id = (select auth.uid())
    )
);

CREATE POLICY "Users can read own complete profile" ON public.profiles
FOR SELECT USING (
  (select auth.uid()) = auth_user_id OR 
  phone IN (SELECT users.phone FROM auth.users WHERE users.id = (select auth.uid()))
);

CREATE POLICY "Limited public profile access"
ON public.profiles
FOR SELECT
USING (
  ((select auth.uid()) = auth_user_id)
  OR (phone = public.get_current_user_phone())
  OR (is_active = true)
);

CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "Anyone can create profile" ON public.user_profiles
    FOR INSERT WITH CHECK ((select auth.uid()) = auth_user_id);

CREATE POLICY "Affiliates can manage their own stores" ON public.affiliate_stores
FOR ALL USING (
  profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())
  )
);

-- Single SELECT policy (fixes multiple_permissive_policies lint)
CREATE POLICY "Admins and merchants can view admin_order_reviews"
ON public.admin_order_reviews
FOR SELECT
USING (
  (get_current_user_role() = 'admin')
  OR (
    merchant_id IN (
      SELECT m.id
      FROM merchants m
      JOIN profiles p ON p.id = m.profile_id
      WHERE p.auth_user_id = (select auth.uid())
    )
    AND status = 'FORWARDED_TO_MERCHANT'
  )
);
CREATE POLICY "Admins can manage order reviews"
ON public.admin_order_reviews
FOR ALL
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Shop owners can manage their invoices" ON public.invoices
    FOR ALL USING (shop_id IN (
        SELECT s.id FROM shops s 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = (select auth.uid())
    ));

CREATE POLICY "Shop owners can manage their invoice items" ON public.invoice_items
    FOR ALL USING (invoice_id IN (
        SELECT i.id FROM invoices i 
        JOIN shops s ON s.id = i.shop_id 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = (select auth.uid())
    ));

CREATE POLICY "Shop owners can manage their payment gateways" ON public.payment_gateways
    FOR ALL USING (shop_id IN (
        SELECT s.id FROM shops s 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = (select auth.uid())
    ));

CREATE POLICY "Shop owners can view their payment transactions" ON public.payment_transactions
    FOR SELECT USING (order_id IN (
        SELECT o.id FROM orders o 
        JOIN shops s ON s.id = o.shop_id 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = (select auth.uid())
    ));

CREATE POLICY "Only service role can insert payment transactions" ON public.payment_transactions
    FOR INSERT WITH CHECK (((select auth.jwt()) ->> 'role') = 'service_role');

CREATE POLICY "Shop owners can manage their refunds" ON public.refunds
    FOR ALL USING (order_id IN (
        SELECT o.id FROM orders o 
        JOIN shops s ON s.id = o.shop_id 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = (select auth.uid())
    ));

CREATE POLICY "Shop owners can manage their refund items" ON public.refund_items
    FOR ALL USING (refund_id IN (
        SELECT r.id FROM refunds r 
        JOIN orders o ON o.id = r.order_id 
        JOIN shops s ON s.id = o.shop_id 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = (select auth.uid())
    ));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Users can insert their initial role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (user_id = (select auth.uid()) AND role = 'customer');

CREATE POLICY "Shop owners can manage their shipments" ON public.shipments FOR ALL USING (
    shop_id IN (
        SELECT s.id FROM shops s 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = (select auth.uid())
    )
);

CREATE POLICY "Shop owners can view their shipment tracking" ON public.shipment_tracking FOR SELECT USING (
    shipment_id IN (
        SELECT sh.id FROM shipments sh 
        JOIN shops s ON s.id = sh.shop_id
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = (select auth.uid())
    )
);

CREATE POLICY "Shop owners can manage security settings" ON public.security_settings
FOR ALL USING (
  shop_id IN (
    SELECT s.id FROM shops s 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = (select auth.uid())
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Shop owners can manage social media accounts" ON public.social_media_accounts
FOR ALL USING (
  shop_id IN (
    SELECT s.id FROM shops s 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = (select auth.uid())
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Shop owners can manage social media posts" ON public.social_media_posts
FOR ALL USING (
  shop_id IN (
    SELECT s.id FROM shops s 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = (select auth.uid())
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Shop owners can manage email campaigns" ON public.email_campaigns
FOR ALL USING (
  shop_id IN (
    SELECT s.id FROM shops s 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = (select auth.uid())
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Shop owners can manage coupons" ON public.coupons
FOR ALL USING (
  shop_id IN (
    SELECT s.id FROM shops s 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = (select auth.uid())
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Customers can use coupons" ON public.coupon_usage
FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Shop owners can view coupon usage" ON public.coupon_usage
FOR SELECT USING (
  coupon_id IN (
    SELECT c.id FROM coupons c 
    JOIN shops s ON s.id = c.shop_id
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = (select auth.uid())
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Shop owners can manage loyalty tiers" ON public.loyalty_tiers
FOR ALL USING (
  shop_id IN (
    SELECT s.id FROM shops s 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = (select auth.uid())
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Customers can view their loyalty points" ON public.customer_loyalty
FOR SELECT USING (
  customer_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Shop owners can manage customer loyalty" ON public.customer_loyalty
FOR ALL USING (
  shop_id IN (
    SELECT s.id FROM shops s 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = (select auth.uid())
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Customers can view their loyalty transactions" ON public.loyalty_transactions
FOR SELECT USING (
  customer_loyalty_id IN (
    SELECT cl.id FROM customer_loyalty cl 
    JOIN profiles p ON p.id = cl.customer_id 
    WHERE p.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Shop system can manage loyalty transactions" ON public.loyalty_transactions
FOR ALL USING (
  customer_loyalty_id IN (
    SELECT cl.id FROM customer_loyalty cl 
    JOIN shops s ON s.id = cl.shop_id
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = (select auth.uid())
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Shop owners can manage loyalty rewards" ON public.loyalty_rewards
FOR ALL USING (
  shop_id IN (
    SELECT s.id FROM shops s 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = (select auth.uid())
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Customers can view and redeem rewards" ON public.loyalty_redemptions
FOR ALL USING (
  customer_loyalty_id IN (
    SELECT cl.id FROM customer_loyalty cl 
    JOIN profiles p ON p.id = cl.customer_id 
    WHERE p.auth_user_id = (select auth.uid())
  ) OR customer_loyalty_id IN (
    SELECT cl.id FROM customer_loyalty cl 
    JOIN shops s ON s.id = cl.shop_id
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = (select auth.uid())
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Product owners can manage product images" ON public.product_images
    FOR ALL USING (
        product_id IN (
            SELECT p.id FROM public.products p
            JOIN public.merchants m ON m.id = p.merchant_id
            JOIN public.profiles pr ON pr.id = m.profile_id
            WHERE pr.auth_user_id = (select auth.uid())
        )
        OR get_current_user_role() = 'admin'::text
    );

CREATE POLICY "Product owners can manage product attributes" ON public.product_attributes
    FOR ALL USING (
        product_id IN (
            SELECT p.id FROM public.products p
            JOIN public.merchants m ON m.id = p.merchant_id
            JOIN public.profiles pr ON pr.id = m.profile_id
            WHERE pr.auth_user_id = (select auth.uid())
        )
        OR get_current_user_role() = 'admin'::text
    );

CREATE POLICY "Users can manage their shipping addresses" ON public.shipping_addresses
  FOR ALL USING (user_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())));

CREATE POLICY "Users can manage their shopping cart" ON public.shopping_carts
  FOR ALL USING (
    user_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid()))
    OR session_id IS NOT NULL -- للمستخدمين غير المسجلين
  );

CREATE POLICY "Users can manage their cart items" ON public.cart_items
  FOR ALL USING (
    cart_id IN (
      SELECT id FROM shopping_carts sc 
      WHERE sc.user_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid()))
      OR sc.session_id IS NOT NULL
    )
  );

CREATE POLICY "Customers can view their orders" ON public.ecommerce_orders
  FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())));

CREATE POLICY "Shop owners can manage their shop orders" ON public.ecommerce_orders
  FOR ALL USING (
    shop_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create orders" ON public.ecommerce_orders
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Customers can view their order items" ON public.ecommerce_order_items
  FOR SELECT USING (
    order_id IN (
      SELECT eo.id FROM ecommerce_orders eo
      WHERE eo.user_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid()))
    )
  );

CREATE POLICY "Shop owners can manage their order items" ON public.ecommerce_order_items
  FOR ALL USING (
    order_id IN (
      SELECT eo.id FROM ecommerce_orders eo 
      JOIN shops s ON s.id = eo.shop_id
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Authenticated users can add order items" ON public.ecommerce_order_items
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Customers can view their order status history" ON public.order_status_history
  FOR SELECT USING (
    order_id IN (
      SELECT eo.id FROM ecommerce_orders eo
      WHERE eo.user_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid()))
    )
  );

CREATE POLICY "Shop owners and admins can manage order status history" ON public.order_status_history
  FOR ALL USING (
    get_current_user_role() = ANY(ARRAY['admin', 'merchant']) OR
    order_id IN (
      SELECT eo.id FROM ecommerce_orders eo 
      JOIN shops s ON s.id = eo.shop_id
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Affiliates can view their order tracking" 
ON public.order_tracking 
FOR SELECT 
USING (
  affiliate_profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "System can create order tracking" 
ON public.order_tracking 
FOR INSERT 
WITH CHECK ((select auth.uid()) IS NOT NULL OR ((select auth.jwt()) ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "System can update order tracking" 
ON public.order_tracking 
FOR UPDATE 
USING ((select auth.uid()) IS NOT NULL OR ((select auth.jwt()) ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Users can manage their own carts" ON shopping_carts
FOR ALL USING (
  user_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())) OR
  user_id IS NULL OR
  session_id IS NOT NULL
);

CREATE POLICY "Users can create carts" ON shopping_carts
FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())) OR
  user_id IS NULL OR
  session_id IS NOT NULL
);

CREATE POLICY "Users can manage cart items" ON cart_items
FOR ALL USING (
  cart_id IN (
    SELECT id FROM shopping_carts WHERE 
    user_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())) OR
    session_id IS NOT NULL
  )
);

CREATE POLICY "Users can view their orders" ON simple_orders
FOR SELECT USING (
  user_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())) OR
  session_id IS NOT NULL
);

CREATE POLICY "Users can create orders" ON simple_orders
FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())) OR
  session_id IS NOT NULL
);

CREATE POLICY "Users can view order items" ON simple_order_items
FOR SELECT USING (
  order_id IN (
    SELECT id FROM simple_orders WHERE 
    user_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())) OR
    session_id IS NOT NULL
  )
);

CREATE POLICY "Users can create order items" ON simple_order_items
FOR INSERT WITH CHECK (
  order_id IN (
    SELECT id FROM simple_orders WHERE 
    user_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())) OR
    session_id IS NOT NULL
  )
);

CREATE POLICY "Users can access carts" ON shopping_carts
FOR ALL USING (
  (user_id IS NULL AND session_id IS NOT NULL) OR 
  (user_id IS NOT NULL AND (select auth.uid()) IS NOT NULL)
);

CREATE POLICY "Users can access cart items" ON cart_items
FOR ALL USING (
  cart_id IN (
    SELECT id FROM shopping_carts WHERE 
    (select auth.uid()) IS NOT NULL OR session_id IS NOT NULL
  )
);

CREATE POLICY "Shop owners can manage shipments" ON public.shipments
FOR ALL USING (
  order_id IN (
    SELECT eo.id FROM ecommerce_orders eo
    JOIN shops s ON s.id = eo.shop_id
    JOIN profiles p ON p.id = s.owner_id
    WHERE p.auth_user_id = (select auth.uid())
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Customers can view their shipments" ON public.shipments
FOR SELECT USING (
  order_id IN (
    SELECT eo.id FROM ecommerce_orders eo
    JOIN profiles p ON p.id = eo.user_id
    WHERE p.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Shop owners manage shipments tracking" ON public.shipments_tracking
FOR ALL USING (
  order_id IN (
    SELECT eo.id FROM ecommerce_orders eo
    JOIN shops s ON s.id = eo.shop_id
    JOIN profiles p ON p.id = s.owner_id
    WHERE p.auth_user_id = (select auth.uid())
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Customers view their shipments tracking" ON public.shipments_tracking
FOR SELECT USING (
  order_id IN (
    SELECT eo.id FROM ecommerce_orders eo
    JOIN profiles p ON p.id = eo.user_id
    WHERE p.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Shop owners manage shipment events" ON public.shipment_events
FOR ALL USING (
  shipment_id IN (
    SELECT st.id FROM shipments_tracking st
    JOIN ecommerce_orders eo ON eo.id = st.order_id
    JOIN shops sh ON sh.id = eo.shop_id
    JOIN profiles p ON p.id = sh.owner_id
    WHERE p.auth_user_id = (select auth.uid())
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Customers view their shipment events" ON public.shipment_events
FOR SELECT USING (
  shipment_id IN (
    SELECT st.id FROM shipments_tracking st
    JOIN ecommerce_orders eo ON eo.id = st.order_id
    JOIN profiles p ON p.id = eo.user_id
    WHERE p.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Shop owners manage store shipping config" ON public.store_shipping_config
FOR ALL USING (
  shop_id IN (
    SELECT s.id FROM shops s
    JOIN profiles p ON p.id = s.owner_id
    WHERE p.auth_user_id = (select auth.uid())
  ) OR get_current_user_role() = 'admin'
);

CREATE POLICY "Customers can view their own data" 
ON public.customers 
FOR SELECT 
USING (profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = (select auth.uid())));

CREATE POLICY "Customers can update their own data" 
ON public.customers 
FOR UPDATE 
USING (profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = (select auth.uid())));

CREATE POLICY "Store owners can view their customers" 
ON public.store_customers 
FOR SELECT 
USING (store_id IN (
  SELECT affiliate_stores.id FROM affiliate_stores 
  WHERE affiliate_stores.profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = (select auth.uid()))
));

CREATE POLICY "Customers can view their store relationships" 
ON public.store_customers 
FOR SELECT 
USING (customer_id IN (
  SELECT customers.id FROM customers 
  JOIN profiles ON profiles.id = customers.profile_id
  WHERE profiles.auth_user_id = (select auth.uid())
));

CREATE POLICY "Store owners and customers can update relationships" 
ON public.store_customers 
FOR UPDATE 
USING (
  store_id IN (
    SELECT affiliate_stores.id FROM affiliate_stores 
    WHERE affiliate_stores.profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = (select auth.uid()))
  ) OR 
  customer_id IN (
    SELECT customers.id FROM customers 
    JOIN profiles ON profiles.id = customers.profile_id
    WHERE profiles.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Customers can manage their addresses" 
ON public.customer_addresses 
FOR ALL 
USING (customer_id IN (
  SELECT customers.id FROM customers 
  JOIN profiles ON profiles.id = customers.profile_id
  WHERE profiles.auth_user_id = (select auth.uid())
));

CREATE POLICY "Users can update own level" ON public.user_levels FOR UPDATE USING (
  user_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = (select auth.uid()))
);

CREATE POLICY "System can manage levels" ON public.user_levels FOR ALL USING (
  get_current_user_role() = 'admin' OR (select auth.jwt())->>'role' = 'service_role'
);

CREATE POLICY "Leaders can manage their alliance" ON public.alliances FOR UPDATE USING (
  leader_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = (select auth.uid()))
);

CREATE POLICY "Affiliates can create alliances" ON public.alliances FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_levels ul 
    JOIN profiles p ON p.id = ul.user_id 
    WHERE p.auth_user_id = (select auth.uid()) 
    AND ul.current_level IN ('silver', 'gold', 'legendary')
  )
);

CREATE POLICY "Users can join/leave alliances" ON public.alliance_members FOR ALL USING (
  user_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = (select auth.uid())) OR
  alliance_id IN (SELECT id FROM alliances WHERE leader_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = (select auth.uid())
  )) OR
  get_current_user_role() = 'admin'
);

CREATE POLICY "Alliance leaders can manage participations" ON public.challenge_participations FOR ALL USING (
  alliance_id IN (SELECT id FROM alliances WHERE leader_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = (select auth.uid())
  )) OR
  get_current_user_role() = 'admin'
);

CREATE POLICY "System can manage castle control" ON public.castle_control FOR ALL USING (
  get_current_user_role() = 'admin' OR (select auth.jwt())->>'role' = 'service_role'
);

CREATE POLICY "System can manage weekly leaderboard" ON public.weekly_leaderboard FOR ALL USING (
  get_current_user_role() = 'admin' OR (select auth.jwt())->>'role' = 'service_role'
);

CREATE POLICY "System can manage monthly leaderboard" ON public.monthly_leaderboard FOR ALL USING (
  get_current_user_role() = 'admin' OR (select auth.jwt())->>'role' = 'service_role'
);

CREATE POLICY "System can manage alliance leaderboard" ON public.alliance_weekly_leaderboard FOR ALL USING (
  get_current_user_role() = 'admin' OR (select auth.jwt())->>'role' = 'service_role'
);

CREATE POLICY "Users can view own themes" ON public.user_themes FOR SELECT USING (
  user_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = (select auth.uid()))
);

CREATE POLICY "System can manage themes" ON public.user_themes FOR ALL USING (
  get_current_user_role() = 'admin' OR (select auth.jwt())->>'role' = 'service_role'
);

CREATE POLICY "Users can create reports" ON public.alliance_reports FOR INSERT WITH CHECK (
  reporter_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = (select auth.uid()))
);

CREATE POLICY "Users can view own reports" ON public.alliance_reports FOR SELECT USING (
  reporter_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = (select auth.uid())) OR
  get_current_user_role() = 'admin'
);

CREATE POLICY "Users can view public rooms" ON public.chat_rooms
  FOR SELECT USING (type = 'public' OR id IN (
    SELECT rm.room_id FROM public.room_members rm WHERE rm.user_id = (select auth.uid())
  ));

CREATE POLICY "Room owners can manage their rooms" ON public.chat_rooms
  FOR ALL USING (owner_id = (select auth.uid()));

CREATE POLICY "Users can join public rooms" ON public.room_members
  FOR INSERT WITH CHECK (
    room_id IN (SELECT id FROM public.chat_rooms WHERE type = 'public') OR
    room_id IN (SELECT id FROM public.chat_rooms WHERE owner_id = (select auth.uid()))
  );

CREATE POLICY "Room members can leave" ON public.room_members
  FOR DELETE USING (user_id = (select auth.uid()));

CREATE POLICY "Room members can view messages" ON public.chat_messages
  FOR SELECT USING (
    room_id IN (
      SELECT rm.room_id FROM public.room_members rm WHERE rm.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Room members can send messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  sender_id IN (
    SELECT p.id FROM profiles p WHERE p.auth_user_id = (select auth.uid())
  )
  AND room_id IN (
    SELECT rm.room_id 
    FROM room_members rm
    JOIN profiles p ON p.id = rm.user_id
    WHERE p.auth_user_id = (select auth.uid())
    AND rm.is_banned = false
    AND (rm.is_muted = false OR rm.muted_until < now())
  )
);

CREATE POLICY "Users can edit their own messages" ON public.chat_messages
  FOR UPDATE USING (sender_id = (select auth.uid()));

CREATE POLICY "Room members can manage reactions" ON public.message_reactions
  FOR ALL USING (
    message_id IN (
      SELECT id FROM public.chat_messages 
      WHERE room_id IN (
        SELECT rm.room_id FROM public.room_members rm WHERE rm.user_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Users can view their own chat points" ON public.atlantis_chat_points
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Inventory staff can manage suppliers" ON public.suppliers
    FOR ALL USING (
        has_any_role((select auth.uid()), ARRAY['admin', 'inventory_manager', 'inventory_staff'])
    );

CREATE POLICY "Inventory staff can manage warehouse products" ON public.warehouse_products
    FOR ALL USING (
        has_any_role((select auth.uid()), ARRAY['admin', 'inventory_manager', 'inventory_staff'])
    );

CREATE POLICY "Affiliates can view active warehouse products" ON public.warehouse_products
    FOR SELECT USING (
        is_active = true AND 
        (get_current_user_role() = 'affiliate' OR has_any_role((select auth.uid()), ARRAY['admin', 'inventory_manager', 'inventory_staff']))
    );

CREATE POLICY "Inventory staff can manage product variants" ON public.product_variants
    FOR ALL USING (
        has_any_role((select auth.uid()), ARRAY['admin', 'inventory_manager', 'inventory_staff'])
    );

CREATE POLICY "Affiliates can view active product variants" ON public.product_variants
    FOR SELECT USING (
        is_active = true AND available_stock > 0 AND
        (get_current_user_role() = 'affiliate' OR has_any_role((select auth.uid()), ARRAY['admin', 'inventory_manager', 'inventory_staff']))
    );

CREATE POLICY "Inventory staff can manage inventory movements" ON public.inventory_movements
    FOR ALL USING (
        has_any_role((select auth.uid()), ARRAY['admin', 'inventory_manager', 'inventory_staff'])
    );

CREATE POLICY "Inventory staff can manage returns" ON public.product_returns
    FOR ALL USING (
        has_any_role((select auth.uid()), ARRAY['admin', 'inventory_manager', 'inventory_staff'])
    );

CREATE POLICY "Inventory staff can manage return items" ON public.return_items
    FOR ALL USING (
        has_any_role((select auth.uid()), ARRAY['admin', 'inventory_manager', 'inventory_staff'])
    );

CREATE POLICY "Users can view relevant alerts" ON public.inventory_alerts
    FOR SELECT USING (
        get_current_user_role() = ANY(created_for_role) OR
        has_any_role((select auth.uid()), ARRAY['admin'])
    );

CREATE POLICY "Users can update alert read status" ON public.inventory_alerts
    FOR UPDATE USING (
        get_current_user_role() = ANY(created_for_role) OR
        has_any_role((select auth.uid()), ARRAY['admin'])
    );

CREATE POLICY "Authenticated users can manage warehouses" ON public.warehouses FOR ALL USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can manage suppliers" ON public.suppliers FOR ALL USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can manage warehouse products" ON public.warehouse_products FOR ALL USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can manage product variants" ON public.product_variants FOR ALL USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can manage inventory items" ON public.inventory_items FOR ALL USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can create inventory movements" ON public.inventory_movements FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can manage inventory alerts" ON public.inventory_alerts FOR ALL USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can manage inventory reservations" ON public.inventory_reservations FOR ALL USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Allow authenticated users to create their own levels" 
ON public.user_levels 
FOR INSERT 
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Allow system and admins to manage all levels" 
ON public.user_levels 
FOR ALL 
TO authenticated
USING (
  -- Allow if user is admin
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.auth_user_id = (select auth.uid()) 
    AND profiles.role = 'admin'
  )
  OR
  -- Allow service role (for system operations)
  (select auth.jwt()) ->> 'role' = 'service_role'
);

CREATE POLICY "Users can update their own levels" 
ON public.user_levels 
FOR UPDATE 
TO authenticated
USING (
  user_id IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.auth_user_id = (select auth.uid())
  )
)
WITH CHECK (
  user_id IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.auth_user_id = (select auth.uid())
  )
);

create policy "select own affiliate store"
on public.affiliate_stores for select
using (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())));

create policy "insert own affiliate store"
on public.affiliate_stores for insert
with check (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())));

create policy "update own affiliate store"
on public.affiliate_stores for update
using (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())));

-- معطل: جدول orders لا يملك عمود affiliate_store_id في الـ schema الحالي
-- create policy "affiliates see their store orders" on public.orders ...

create policy "affiliate sees own commissions"
on public.commissions for select
using (affiliate_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())));

-- معطل: جدول orders لا يملك عمود affiliate_store_id
-- create policy "affiliate_view_store_orders" on public.orders ...

create policy "affiliate_view_own_commissions"
on public.commissions for select
using (affiliate_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())));

-- سياسات orders/order_items المعتمدة على customer_profile_id معطلة لأن العمود غير موجود في الـ schema الحالي
-- أضف العمود أو استعد السياسات عند توفره
-- CREATE POLICY "authenticated_users_can_view_own_orders" ON orders ...
-- CREATE POLICY "authenticated_users_can_view_own_order_items" ON order_items ...

CREATE POLICY "authenticated_users_can_view_related_orders" ON orders
  FOR SELECT TO authenticated
  USING (
    (get_current_user_role() = 'admin') OR
    (shop_id IN (
      SELECT shops.id FROM shops 
      JOIN profiles ON profiles.id = shops.owner_id
      WHERE profiles.auth_user_id = (select auth.uid())
    ))
  );

CREATE POLICY "authenticated_users_can_view_related_order_items" ON order_items  
  FOR SELECT TO authenticated
  USING (
    order_id IN (
      SELECT orders.id FROM orders WHERE (
        (get_current_user_role() = 'admin') OR
        (shop_id IN (
          SELECT shops.id FROM shops 
          JOIN profiles ON profiles.id = shops.owner_id
          WHERE profiles.auth_user_id = (select auth.uid())
        ))
      )
    )
  );

CREATE POLICY "cart_store_scoped_access"
    ON public.shopping_carts
    FOR ALL 
    USING (
        ((select auth.uid()) IS NOT NULL AND user_id = (select auth.uid()))
        OR (session_id IS NOT NULL)
        OR (affiliate_store_id IN (
            SELECT ast.id FROM affiliate_stores ast
            JOIN profiles p ON p.id = ast.profile_id
            WHERE p.auth_user_id = (select auth.uid())
        ))
    );

CREATE POLICY "cart_items_store_scoped"
    ON public.cart_items
    FOR ALL
    USING (
        cart_id IN (
            SELECT sc.id FROM shopping_carts sc
            WHERE ((select auth.uid()) IS NOT NULL AND sc.user_id = (select auth.uid()))
               OR (sc.session_id IS NOT NULL)
               OR (sc.affiliate_store_id IN (
                   SELECT ast.id FROM affiliate_stores ast
                   JOIN profiles p ON p.id = ast.profile_id
                   WHERE p.auth_user_id = (select auth.uid())
               ))
        )
    );

CREATE POLICY "cart_items_enhanced_access"
ON public.cart_items
FOR ALL
USING (
    cart_id IN (
        SELECT sc.id FROM public.shopping_carts sc
        WHERE (((select auth.uid()) IS NOT NULL) AND (sc.user_id = (select auth.uid())))
            OR (sc.session_id IS NOT NULL)
            OR (sc.affiliate_store_id IN (
                SELECT ast.id FROM affiliate_stores ast
                JOIN profiles p ON p.id = ast.profile_id
                WHERE p.auth_user_id = (select auth.uid())
            ))
    )
);

CREATE POLICY "Product owners can manage variants" 
ON public.product_variants FOR ALL 
USING (
  product_id IN (
    SELECT p.id FROM products p 
    JOIN shops s ON s.id = p.shop_id 
    JOIN profiles pr ON pr.id = s.owner_id 
    WHERE pr.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Admins can manage variant options" 
ON public.product_variant_options FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE auth_user_id = (select auth.uid()) 
    AND role = 'admin'
  )
);

CREATE POLICY "Store owners can manage their customers" ON store_customers
FOR ALL USING (
  store_id IN (
    SELECT affiliate_stores.id FROM affiliate_stores
    JOIN profiles ON profiles.id = affiliate_stores.profile_id
    WHERE profiles.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Store owners can manage their store themes" 
ON public.affiliate_store_themes 
FOR ALL 
USING (
  store_id IN (
    SELECT id FROM affiliate_stores 
    WHERE profile_id IN (
      SELECT id FROM profiles 
      WHERE auth_user_id = (select auth.uid())
    )
  )
);

CREATE POLICY "Store owners can view their store themes" 
ON public.affiliate_store_themes 
FOR SELECT 
USING (
  store_id IN (
    SELECT id FROM affiliate_stores 
    WHERE profile_id IN (
      SELECT id FROM profiles 
      WHERE auth_user_id = (select auth.uid())
    )
  )
);

CREATE POLICY "Users can view their own custom themes" 
ON public.user_custom_themes FOR SELECT 
USING ((select auth.uid())::text = user_id::text OR is_public = true);

CREATE POLICY "Users can create their own custom themes" 
ON public.user_custom_themes FOR INSERT 
WITH CHECK ((select auth.uid())::text = user_id::text);

CREATE POLICY "Users can update their own custom themes" 
ON public.user_custom_themes FOR UPDATE 
USING ((select auth.uid())::text = user_id::text);

CREATE POLICY "Users can view their theme analytics" 
ON public.theme_usage_analytics FOR SELECT 
USING ((select auth.uid())::text = user_id::text);

CREATE POLICY "Users can insert their theme analytics" 
ON public.theme_usage_analytics FOR INSERT 
WITH CHECK ((select auth.uid())::text = user_id::text);

CREATE POLICY "Store owners can manage their banners" ON public.promotional_banners
  FOR ALL USING (
    (store_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = (select auth.uid())
    )) OR (get_current_user_role() = 'admin')
  );

CREATE POLICY "Store owners can manage their campaigns" ON promotion_campaigns
  FOR ALL USING (
    store_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Store owners can view their banner analytics" ON public.banner_analytics
  FOR SELECT USING (
    banner_id IN (
      SELECT pb.id FROM promotional_banners pb
      WHERE (pb.store_id IN (
          SELECT s.id FROM shops s 
          JOIN profiles p ON p.id = s.owner_id 
          WHERE p.auth_user_id = (select auth.uid())
        )) OR (get_current_user_role() = 'admin')
    )
  );

CREATE POLICY "Store owners can manage campaign banners" ON public.campaign_banners
  FOR ALL USING (
    campaign_id IN (
      SELECT pc.id FROM promotion_campaigns pc
      WHERE (pc.store_id IN (
          SELECT s.id FROM shops s 
          JOIN profiles p ON p.id = s.owner_id 
          WHERE p.auth_user_id = (select auth.uid())
        )) OR (get_current_user_role() = 'admin')
    )
  );

CREATE POLICY "Store owners can manage their pages" ON store_pages
  FOR ALL USING (
    store_id IN (
      SELECT id FROM affiliate_stores 
      WHERE profile_id IN (
        SELECT id FROM profiles 
        WHERE auth_user_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Store owners can create custom templates" ON page_templates
  FOR ALL USING (
    created_by IN (
      SELECT id FROM profiles 
      WHERE auth_user_id = (select auth.uid())
    ) OR is_system_template = true
  );

CREATE POLICY "Store owners can manage their content sections" ON content_sections
  FOR ALL USING (
    store_id IN (
      SELECT id FROM affiliate_stores 
      WHERE profile_id IN (
        SELECT id FROM profiles 
        WHERE auth_user_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Store owners can manage content blocks" ON content_blocks
  FOR ALL USING (
    section_id IN (
      SELECT cs.id FROM content_sections cs
      JOIN affiliate_stores ast ON ast.id = cs.store_id
      JOIN profiles p ON p.id = ast.profile_id
      WHERE p.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Store owners can manage their media" ON media_library
  FOR ALL USING (
    store_id IN (
      SELECT id FROM affiliate_stores 
      WHERE profile_id IN (
        SELECT id FROM profiles 
        WHERE auth_user_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Store owners can manage their forms" ON custom_forms
  FOR ALL USING (
    store_id IN (
      SELECT id FROM affiliate_stores 
      WHERE profile_id IN (
        SELECT id FROM profiles 
        WHERE auth_user_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Store owners can view their form submissions" ON form_submissions
  FOR SELECT USING (
    form_id IN (
      SELECT cf.id FROM custom_forms cf
      JOIN affiliate_stores ast ON ast.id = cf.store_id
      JOIN profiles p ON p.id = ast.profile_id
      WHERE p.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Store owners can manage bundle offers" ON public.bundle_offers
  FOR ALL USING (
    (store_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = (select auth.uid())
    )) OR (get_current_user_role() = 'admin')
  );

CREATE POLICY "Store owners can manage customer segments" ON public.customer_segments
  FOR ALL USING (
    (store_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = (select auth.uid())
    )) OR (get_current_user_role() = 'admin')
  );

CREATE POLICY "Store owners can view campaign usage" ON public.campaign_usage
  FOR SELECT USING (
    campaign_id IN (
      SELECT pc.id FROM promotion_campaigns pc
      WHERE (pc.store_id IN (
        SELECT s.id FROM shops s 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = (select auth.uid())
      )) OR (get_current_user_role() = 'admin')
    )
  );

CREATE POLICY "Store owners can manage seasonal campaigns" ON public.seasonal_campaigns
  FOR ALL USING (
    campaign_id IN (
      SELECT pc.id FROM promotion_campaigns pc
      WHERE (pc.store_id IN (
        SELECT s.id FROM shops s 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = (select auth.uid())
      )) OR (get_current_user_role() = 'admin')
    )
  );

CREATE POLICY "Store owners can manage marketing campaigns" ON marketing_automation_campaigns
  FOR ALL 
  USING (
    store_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = (select auth.uid())
    ) OR get_current_user_role() = 'admin'
  );

CREATE POLICY "Store owners can manage leads" ON leads
  FOR ALL 
  USING (
    store_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = (select auth.uid())
    ) OR get_current_user_role() = 'admin'
  );

CREATE POLICY "Store owners can view lead activities" ON lead_activities
  FOR SELECT 
  USING (
    lead_id IN (
      SELECT l.id FROM leads l WHERE (
        l.store_id IN (
          SELECT s.id FROM shops s 
          JOIN profiles p ON p.id = s.owner_id 
          WHERE p.auth_user_id = (select auth.uid())
        )
      )
    ) OR get_current_user_role() = 'admin'
  );

CREATE POLICY "Store owners can create lead activities" ON lead_activities
  FOR INSERT 
  WITH CHECK (
    lead_id IN (
      SELECT l.id FROM leads l WHERE (
        l.store_id IN (
          SELECT s.id FROM shops s 
          JOIN profiles p ON p.id = s.owner_id 
          WHERE p.auth_user_id = (select auth.uid())
        )
      )
    )
  );

CREATE POLICY "Store owners can view analytics events" ON advanced_analytics_events
  FOR SELECT 
  USING (
    store_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = (select auth.uid())
    ) OR get_current_user_role() = 'admin'
  );

CREATE POLICY "Store owners can manage customer journey" ON customer_journey_steps
  FOR ALL 
  USING (
    store_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = (select auth.uid())
    ) OR get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can view their notifications" ON smart_notifications
  FOR SELECT 
  USING (
    recipient_id = (select auth.uid()) OR
    sender_id IN (
      SELECT p.auth_user_id FROM profiles p WHERE p.auth_user_id = (select auth.uid())
    ) OR
    get_current_user_role() = 'admin'
  );

CREATE POLICY "Store owners can send notifications" ON smart_notifications
  FOR INSERT 
  WITH CHECK (
    store_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = (select auth.uid())
    ) OR get_current_user_role() = 'admin'
  );

CREATE POLICY "Store owners can manage behavioral triggers" ON behavioral_triggers
  FOR ALL 
  USING (
    store_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = (select auth.uid())
    ) OR get_current_user_role() = 'admin'
  );

CREATE POLICY "Store owners can view predictive insights" ON predictive_insights
  FOR SELECT 
  USING (
    store_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = (select auth.uid())
    ) OR get_current_user_role() = 'admin'
  );

CREATE POLICY "Store owners can manage their pages" ON public.cms_custom_pages
    FOR ALL USING (
        (store_id IN (
            SELECT s.id FROM shops s
            JOIN profiles p ON p.id = s.owner_id
            WHERE p.auth_user_id = (select auth.uid())
        )) OR
        get_current_user_role() = 'admin'
    );

CREATE POLICY "Store owners can manage page widgets" ON public.cms_content_widgets
    FOR ALL USING (
        page_id IN (
            SELECT cp.id FROM cms_custom_pages cp
            WHERE (
                (cp.store_id IN (
                    SELECT s.id FROM shops s
                    JOIN profiles p ON p.id = s.owner_id
                    WHERE p.auth_user_id = (select auth.uid())
                )) OR
                get_current_user_role() = 'admin'
            )
        )
    );

CREATE POLICY "Store owners can view page SEO analytics" ON public.cms_seo_analytics
    FOR SELECT USING (
        page_id IN (
            SELECT cp.id FROM cms_custom_pages cp
            WHERE (
                (cp.store_id IN (
                    SELECT s.id FROM shops s
                    JOIN profiles p ON p.id = s.owner_id
                    WHERE p.auth_user_id = (select auth.uid())
                )) OR
                get_current_user_role() = 'admin'
            )
        )
    );

CREATE POLICY "Store owners can view page revisions" ON public.cms_page_revisions
    FOR SELECT USING (
        page_id IN (
            SELECT cp.id FROM cms_custom_pages cp
            WHERE (
                (cp.store_id IN (
                    SELECT s.id FROM shops s
                    JOIN profiles p ON p.id = s.owner_id
                    WHERE p.auth_user_id = (select auth.uid())
                )) OR
                get_current_user_role() = 'admin'
            )
        )
    );

CREATE POLICY "Store owners can create page revisions" ON public.cms_page_revisions
    FOR INSERT WITH CHECK (
        page_id IN (
            SELECT cp.id FROM cms_custom_pages cp
            WHERE (
                cp.store_id IN (
                    SELECT s.id FROM shops s
                    JOIN profiles p ON p.id = s.owner_id
                    WHERE p.auth_user_id = (select auth.uid())
                )
                OR get_current_user_role() = 'admin'
            )
        )
    );

CREATE POLICY "Store owners can manage page elements" ON public.page_builder_elements
FOR ALL USING (
  page_id IN (
    SELECT cp.id FROM cms_custom_pages cp
    WHERE (
      cp.store_id IN (
        SELECT s.id FROM shops s
        JOIN profiles p ON p.id = s.owner_id
        WHERE p.auth_user_id = (select auth.uid())
      )
      OR get_current_user_role() = 'admin'
    )
  )
);

CREATE POLICY "Users can manage their own components" ON public.saved_page_components
FOR ALL USING (
  created_by IN (
    SELECT p.id FROM profiles p WHERE p.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can manage their own sessions" ON public.page_builder_sessions
FOR ALL USING (
  user_id IN (
    SELECT p.id FROM profiles p WHERE p.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can manage their own drafts" ON public.content_editor_drafts
FOR ALL USING (
  created_by IN (
    SELECT p.id FROM profiles p WHERE p.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Store owners can manage visual themes" ON public.visual_theme_customizations
FOR ALL USING (
  (store_id IN (
    SELECT s.id FROM shops s
    JOIN profiles p ON p.id = s.owner_id
    WHERE p.auth_user_id = (select auth.uid())
  ))
  OR get_current_user_role() = 'admin'
);

CREATE POLICY "Store owners can manage interactive elements" ON public.interactive_elements
FOR ALL USING (
  element_id IN (
    SELECT pbe.id FROM page_builder_elements pbe
    WHERE pbe.page_id IN (
      SELECT cp.id FROM cms_custom_pages cp
      WHERE (
        cp.store_id IN (
          SELECT s.id FROM shops s
          JOIN profiles p ON p.id = s.owner_id
          WHERE p.auth_user_id = (select auth.uid())
        )
        OR get_current_user_role() = 'admin'
      )
    )
  )
);

CREATE POLICY "Users can manage their product media" ON product_media
  FOR ALL USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN merchants m ON p.merchant_id = m.id
      JOIN profiles prof ON m.profile_id = prof.id
      WHERE prof.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can manage their product discounts" ON product_discounts
  FOR ALL USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN merchants m ON p.merchant_id = m.id
      JOIN profiles prof ON m.profile_id = prof.id
      WHERE prof.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can manage their product variants" ON product_variants_advanced
  FOR ALL USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN merchants m ON p.merchant_id = m.id
      JOIN profiles prof ON m.profile_id = prof.id
      WHERE prof.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can manage their product SEO" ON product_seo
  FOR ALL USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN merchants m ON p.merchant_id = m.id
      JOIN profiles prof ON m.profile_id = prof.id
      WHERE prof.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can manage their product shipping" ON product_shipping
  FOR ALL USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN merchants m ON p.merchant_id = m.id
      JOIN profiles prof ON m.profile_id = prof.id
      WHERE prof.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can view their permissions" ON product_permissions
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can view their activity log" ON product_activity_log
  FOR SELECT USING (
    user_id = (select auth.uid()) OR 
    product_id IN (
      SELECT id FROM products 
      WHERE merchant_id IN (
        SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Users can manage products through shops" 
ON public.products 
FOR ALL 
USING (
    shop_id IN (
        SELECT s.id 
        FROM shops s 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = (select auth.uid())
    ) 
    OR merchant_id IN (
        SELECT m.id 
        FROM merchants m 
        JOIN profiles p ON p.id = m.profile_id 
        WHERE p.auth_user_id = (select auth.uid())
    )
) 
WITH CHECK (
    shop_id IN (
        SELECT s.id 
        FROM shops s 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = (select auth.uid())
    ) 
    OR merchant_id IN (
        SELECT m.id 
        FROM merchants m 
        JOIN profiles p ON p.id = m.profile_id 
        WHERE p.auth_user_id = (select auth.uid())
    )
);

CREATE POLICY "Secure profile access" 
ON public.profiles 
FOR SELECT 
USING (
  auth_user_id = (select auth.uid()) OR 
  get_current_user_role() = 'admin'
);

CREATE POLICY "Secure cart items access" 
ON public.cart_items 
FOR ALL 
USING (
  cart_id IN (
    SELECT sc.id FROM shopping_carts sc
    WHERE sc.user_id = (select auth.uid()) OR sc.session_id IS NOT NULL
  )
);

CREATE POLICY "Store owners can manage their settings"
ON public.affiliate_store_settings
FOR ALL
USING (store_id IN (
  SELECT affiliate_stores.id
  FROM affiliate_stores
  WHERE affiliate_stores.profile_id IN (
    SELECT profiles.id
    FROM profiles
    WHERE profiles.auth_user_id = (select auth.uid())
  )
));

CREATE POLICY "Anyone can read their own cart"
  ON shopping_carts
  FOR SELECT
  USING (
    ((select auth.uid()) IS NOT NULL AND user_id = (select auth.uid())) 
    OR 
    (session_id IS NOT NULL)
  );

CREATE POLICY "Anyone can create cart"
  ON shopping_carts
  FOR INSERT
  WITH CHECK (
    ((select auth.uid()) IS NOT NULL AND user_id = (select auth.uid())) 
    OR 
    (session_id IS NOT NULL AND user_id IS NULL)
  );

CREATE POLICY "Anyone can update their own cart"
  ON shopping_carts
  FOR UPDATE
  USING (
    ((select auth.uid()) IS NOT NULL AND user_id = (select auth.uid())) 
    OR 
    (session_id IS NOT NULL)
  );

CREATE POLICY "Anyone can read their cart items"
  ON cart_items
  FOR SELECT
  USING (
    cart_id IN (
      SELECT id FROM shopping_carts
      WHERE ((select auth.uid()) IS NOT NULL AND user_id = (select auth.uid()))
         OR (session_id IS NOT NULL)
    )
  );

CREATE POLICY "Anyone can add items to their cart"
  ON cart_items
  FOR INSERT
  WITH CHECK (
    cart_id IN (
      SELECT id FROM shopping_carts
      WHERE ((select auth.uid()) IS NOT NULL AND user_id = (select auth.uid()))
         OR (session_id IS NOT NULL)
    )
  );

CREATE POLICY "Anyone can update their cart items"
  ON cart_items
  FOR UPDATE
  USING (
    cart_id IN (
      SELECT id FROM shopping_carts
      WHERE ((select auth.uid()) IS NOT NULL AND user_id = (select auth.uid()))
         OR (session_id IS NOT NULL)
    )
  );

CREATE POLICY "Anyone can delete their cart items"
  ON cart_items
  FOR DELETE
  USING (
    cart_id IN (
      SELECT id FROM shopping_carts
      WHERE ((select auth.uid()) IS NOT NULL AND user_id = (select auth.uid()))
         OR (session_id IS NOT NULL)
    )
  );

-- معطل: ecommerce_orders/affiliate_coupons لا تملك عمود affiliate_store_id
-- CREATE POLICY "Affiliates can view their store orders" ON ecommerce_orders ...
-- CREATE POLICY "Affiliates can view their store order items" ON ecommerce_order_items ...
-- CREATE POLICY "Affiliates can manage their coupons" ON affiliate_coupons ...
-- CREATE POLICY "Affiliates can view coupon usage" ON affiliate_coupon_usage ...

CREATE POLICY "Users can view own withdrawal requests" ON public.withdrawal_requests
    FOR SELECT
    USING (affiliate_profile_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())));

CREATE POLICY "Users can create own withdrawal requests" ON public.withdrawal_requests
    FOR INSERT
    WITH CHECK (affiliate_profile_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())));

CREATE POLICY "Admins can view all withdrawal requests" ON public.withdrawal_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE auth_user_id = (select auth.uid()) 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update withdrawal requests" ON public.withdrawal_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE auth_user_id = (select auth.uid()) 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update platform settings" ON public.platform_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE auth_user_id = (select auth.uid()) 
            AND role = 'admin'
        )
    );

CREATE POLICY "المسوقون يمكنهم عرض طلبات السحب الخاصة بهم"
ON public.withdrawal_requests
FOR SELECT
USING (
  affiliate_profile_id IN (
    SELECT id FROM public.profiles 
    WHERE auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "المسوقون يمكنهم إنشاء طلبات سحب"
ON public.withdrawal_requests
FOR INSERT
WITH CHECK (
  affiliate_profile_id IN (
    SELECT id FROM public.profiles 
    WHERE auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Merchants can view own products" ON public.products
  FOR SELECT USING (
    merchant_id IN (
      SELECT m.id FROM public.merchants m 
      JOIN public.profiles p ON p.id = m.profile_id
      WHERE p.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Merchants can insert products" ON public.products
  FOR INSERT WITH CHECK (
    merchant_id IN (
      SELECT m.id FROM public.merchants m 
      JOIN public.profiles p ON p.id = m.profile_id
      WHERE p.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Merchants can update own pending products" ON public.products
  FOR UPDATE USING (
    merchant_id IN (
      SELECT m.id FROM public.merchants m 
      JOIN public.profiles p ON p.id = m.profile_id
      WHERE p.auth_user_id = (select auth.uid())
    ) AND approval_status = 'pending'
  );

CREATE POLICY "Admins can manage all products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE auth_user_id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Users can view own payment info"
  ON public.affiliate_payment_info
  FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own payment info"
  ON public.affiliate_payment_info
  FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own payment info"
  ON public.affiliate_payment_info
  FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Merchants can insert own merchant record"
ON public.merchants
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = profile_id AND p.auth_user_id = (select auth.uid())
  )
  AND public.has_role((select auth.uid()), 'merchant')
);

CREATE POLICY "Merchants can view own merchant record"
ON public.merchants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = profile_id AND p.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Merchants can update own merchant record"
ON public.merchants
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = profile_id AND p.auth_user_id = (select auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = profile_id AND p.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Store owners can view their banners" ON public.store_banners
    FOR SELECT USING (
        store_id IN (
            SELECT id FROM public.affiliate_stores
            WHERE profile_id = (
                SELECT id FROM public.profiles WHERE auth_user_id = (select auth.uid())
            )
        )
    );

CREATE POLICY "Store owners can manage their banners" ON public.store_banners
    FOR ALL USING (
        store_id IN (
            SELECT id FROM public.affiliate_stores
            WHERE profile_id = (
                SELECT id FROM public.profiles WHERE auth_user_id = (select auth.uid())
            )
        )
    );

CREATE POLICY "Authenticated users can vote on reviews" ON public.review_votes
    FOR INSERT WITH CHECK (
        (select auth.uid()) IS NOT NULL AND
        voter_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = (select auth.uid()))
    );

CREATE POLICY "Users can update their own votes" ON public.review_votes
    FOR UPDATE USING (
        voter_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = (select auth.uid()))
    );

CREATE POLICY "Users can delete their own votes" ON public.review_votes
    FOR DELETE USING (
        voter_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = (select auth.uid()))
    );

CREATE POLICY "Customers can view their own customer service chats" ON public.chat_rooms
  FOR SELECT USING (
    type = 'direct' AND
    owner_id IN (SELECT id FROM public.profiles WHERE auth_user_id = (select auth.uid()))
  );

-- معطل: chat_rooms لا يملك عمود affiliate_store_id
-- CREATE POLICY "Store owners can view their store's customer service chats" ...

CREATE POLICY "Authenticated users can create customer service chats" ON public.chat_rooms
  FOR INSERT WITH CHECK (
    type = 'direct' AND
    (select auth.uid()) IS NOT NULL AND
    owner_id IN (SELECT id FROM public.profiles WHERE auth_user_id = (select auth.uid()))
  );

CREATE POLICY "Merchants can view orders with their products" ON public.ecommerce_orders
  FOR SELECT USING (
    id IN (
      SELECT DISTINCT eoi.order_id
      FROM public.ecommerce_order_items eoi
      JOIN public.products p ON eoi.product_id = p.id
      JOIN public.merchants m ON p.merchant_id = m.id
      JOIN public.profiles prof ON m.profile_id = prof.id
      WHERE prof.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Merchants can view their product order items" ON public.ecommerce_order_items
  FOR SELECT USING (
    product_id IN (
      SELECT p.id
      FROM public.products p
      JOIN public.merchants m ON p.merchant_id = m.id
      JOIN public.profiles prof ON m.profile_id = prof.id
      WHERE prof.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Merchants can update order status" ON public.ecommerce_orders
  FOR UPDATE USING (
    id IN (
      SELECT DISTINCT eoi.order_id
      FROM public.ecommerce_order_items eoi
      JOIN public.products p ON eoi.product_id = p.id
      JOIN public.merchants m ON p.merchant_id = m.id
      JOIN public.profiles prof ON m.profile_id = prof.id
      WHERE prof.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Service can create customer profiles via OTP"
ON public.profiles
FOR INSERT
WITH CHECK (
  phone IS NOT NULL 
  AND role = 'customer'
  AND (auth_user_id IS NULL OR auth_user_id = (select auth.uid()))
);

-- معطل: order_hub لا يملك عمود affiliate_store_id
-- CREATE POLICY "Affiliates can view their orders" ON order_hub ...

CREATE POLICY "Merchants can view their shop orders"
  ON public.order_hub FOR SELECT
  USING (
    shop_id IN (
      SELECT s.id FROM public.shops s
      JOIN public.profiles p ON p.id = s.owner_id
      WHERE p.auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can view shipment history for their orders"
ON shipment_status_history FOR SELECT
USING (
  shipment_id IN (
    SELECT s.id FROM shipments s
    WHERE s.shop_id IN (
      SELECT sh.id FROM shops sh
      JOIN profiles p ON p.id = sh.owner_id
      WHERE p.auth_user_id = (select auth.uid())
    )
    OR s.order_id IN (
      SELECT oh.id FROM order_hub oh
      WHERE oh.shop_id IN (
        SELECT sh.id FROM shops sh
        JOIN profiles p ON p.id = sh.owner_id
        WHERE p.auth_user_id = (select auth.uid())
      )
    )
  )
  OR get_current_user_role() = 'admin'
);

CREATE POLICY "Shop owners can view their orders" 
    ON public.order_hub FOR SELECT USING (
      shop_id IN (SELECT s.id FROM shops s JOIN profiles p ON p.id = s.owner_id WHERE p.auth_user_id = (select auth.uid()))
      OR get_current_user_role() = 'admin'
    );

CREATE POLICY "System can insert reports" ON public.data_quality_report
FOR INSERT WITH CHECK (
  ((select auth.jwt())->>'role') = 'service_role' OR get_current_user_role() = 'admin'
);

CREATE POLICY "Users can select own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth_user_id = (select auth.uid()));

CREATE POLICY "profile_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth_user_id = (select auth.uid()));

CREATE POLICY "profile_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth_user_id = (select auth.uid())) WITH CHECK (auth_user_id = (select auth.uid()));

CREATE POLICY "Users view their wallet transactions"
  ON public.wallet_transactions
  FOR SELECT
  USING (affiliate_profile_id = (select auth.uid()));

CREATE POLICY "Users view their wallet balance"
  ON public.wallet_balances
  FOR SELECT
  USING (affiliate_profile_id = (select auth.uid()));

CREATE POLICY "Users view their returns"
  ON public.order_returns
  FOR SELECT
  USING (
    customer_id = (select auth.uid()) OR 
    affiliate_id = (select auth.uid())
  );

CREATE POLICY "Users view their withdrawal requests"
  ON public.withdrawal_requests
  FOR SELECT
  USING (affiliate_profile_id = (select auth.uid()));

CREATE POLICY "Users create their withdrawal requests"
  ON public.withdrawal_requests
  FOR INSERT
  WITH CHECK (affiliate_profile_id = (select auth.uid()));

CREATE POLICY "Merchants view own wallet" ON merchant_wallet_balances
FOR SELECT USING (
  merchant_id IN (
    SELECT m.id FROM merchants m
    JOIN profiles p ON p.id = m.profile_id
    WHERE p.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Admins view all wallets"
  ON public.merchant_wallet_balances FOR SELECT
  USING (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Merchants view own transactions" ON merchant_transactions
FOR SELECT USING (
  merchant_id IN (
    SELECT m.id FROM merchants m
    JOIN profiles p ON p.id = m.profile_id
    WHERE p.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Admins view all transactions"
  ON public.merchant_transactions FOR SELECT
  USING (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Merchants view own withdrawals"
  ON public.merchant_withdrawal_requests FOR SELECT
  USING (
    merchant_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Merchants create own withdrawals"
  ON public.merchant_withdrawal_requests FOR INSERT
  WITH CHECK (
    merchant_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins manage all withdrawals"
  ON public.merchant_withdrawal_requests FOR ALL
  USING (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins view all revenue"
  ON public.platform_revenue FOR SELECT
  USING (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Merchants view own revenue"
  ON public.platform_revenue FOR SELECT
  USING (
    merchant_id IN (
      SELECT id FROM public.profiles WHERE auth_user_id = (select auth.uid())
    )
  );

CREATE POLICY "Affiliates view own wallet"
ON wallet_balances
FOR SELECT
TO public
USING (
  affiliate_profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Affiliates create own wallet"
ON wallet_balances
FOR INSERT
TO public
WITH CHECK (
  affiliate_profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Affiliates update own wallet"
ON wallet_balances
FOR UPDATE
TO public
USING (
  affiliate_profile_id IN (
    SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Merchants create own wallet" ON merchant_wallet_balances
FOR INSERT WITH CHECK (
  merchant_id IN (
    SELECT m.id FROM merchants m
    JOIN profiles p ON p.id = m.profile_id
    WHERE p.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Merchants update own wallet" ON merchant_wallet_balances
FOR UPDATE USING (
  merchant_id IN (
    SELECT m.id FROM merchants m
    JOIN profiles p ON p.id = m.profile_id
    WHERE p.auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Admins manage all affiliate wallets"
ON wallet_balances
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE auth_user_id = (select auth.uid()) 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins manage all merchant wallets"
ON merchant_wallet_balances
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE auth_user_id = (select auth.uid()) 
    AND role = 'admin'
  )
);

CREATE POLICY "Affiliates can view their own subscriptions"
ON public.affiliate_subscriptions
FOR SELECT
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Affiliates can create their own subscriptions"
ON public.affiliate_subscriptions
FOR INSERT
WITH CHECK (
  profile_id IN (
    SELECT id FROM public.profiles WHERE auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Admins can view all subscriptions"
ON public.affiliate_subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE auth_user_id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "Admins can update all subscriptions"
ON public.affiliate_subscriptions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE auth_user_id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING ((select auth.uid()) = auth_user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.profiles p ON p.id = ur.user_id
        WHERE p.auth_user_id = (select auth.uid())
        AND ur.role = 'admin'
    )
);

CREATE POLICY "Affiliates view own payment info"
ON public.affiliate_payment_info FOR SELECT
USING (
  profile_id IN (
    SELECT id FROM public.profiles 
    WHERE auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Affiliates update own payment info"
ON public.affiliate_payment_info FOR UPDATE
USING (
  profile_id IN (
    SELECT id FROM public.profiles 
    WHERE auth_user_id = (select auth.uid())
  )
)
WITH CHECK (
  profile_id IN (
    SELECT id FROM public.profiles 
    WHERE auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Affiliates insert own payment info"
ON public.affiliate_payment_info FOR INSERT
WITH CHECK (
  profile_id IN (
    SELECT id FROM public.profiles 
    WHERE auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Admins view all payment info"
ON public.affiliate_payment_info FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = (SELECT id FROM public.profiles WHERE auth_user_id = (select auth.uid()))
    AND ur.role = 'admin'
    AND ur.is_active = true
  )
);

CREATE POLICY "Users can view own OTP sessions"
ON public.customer_otp_sessions FOR SELECT
USING (
  phone IN (
    SELECT phone FROM public.profiles 
    WHERE auth_user_id = (select auth.uid())
  )
);

CREATE POLICY "Service role can manage OTP sessions"
ON public.customer_otp_sessions FOR ALL
USING ((select auth.jwt())->>'role' = 'service_role');

CREATE POLICY "profiles_select_policy"
ON public.profiles
FOR SELECT
USING (
  auth_user_id = (select auth.uid()) 
  OR is_admin()
);

CREATE POLICY "profiles_update_policy"
ON public.profiles
FOR UPDATE
USING (auth_user_id = (select auth.uid()))
WITH CHECK (auth_user_id = (select auth.uid()));

-- معطل: stock_alerts لا يملك عمود affiliate_store_id
-- CREATE POLICY "Store owners can view their alerts" ...
-- CREATE POLICY "Store owners can manage their alerts" ...

CREATE POLICY "Room creators can view their rooms"
ON public.meeting_rooms FOR SELECT
USING (created_by IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())));

CREATE POLICY "Authenticated users can create rooms"
ON public.meeting_rooms FOR INSERT
WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Room creators can update their rooms"
ON public.meeting_rooms FOR UPDATE
USING (created_by IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())));

CREATE POLICY "Anyone can view participants of rooms they can access"
ON public.meeting_participants FOR SELECT
USING (EXISTS (
  SELECT 1 FROM meeting_rooms mr 
  WHERE mr.id = room_id 
  AND (mr.is_private = false OR mr.created_by IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())))
));

CREATE POLICY "Authenticated users can join rooms"
ON public.meeting_participants FOR INSERT
WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Participants can update their own record"
ON public.meeting_participants FOR UPDATE
USING (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = (select auth.uid())));

CREATE POLICY "Users can manage their brain conversations"
ON public.brain_conversations FOR ALL
USING (user_id = (select auth.uid()) OR public.is_admin());

CREATE POLICY "Admins can manage apps" ON marketplace_apps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Store owners can view their installed apps"
ON public.installed_apps FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.affiliate_stores
    WHERE id = installed_apps.store_id
    AND profile_id = (select auth.uid())
  )
);

CREATE POLICY "Store owners can manage their apps" ON installed_apps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM affiliate_stores ast
            JOIN profiles p ON p.id = ast.profile_id
            WHERE ast.id = store_id
            AND p.auth_user_id = (select auth.uid())
        )
    );

CREATE POLICY "App owners can manage their API keys" ON app_api_keys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM installed_apps ia
            JOIN affiliate_stores ast ON ast.id = ia.store_id
            JOIN profiles p ON p.id = ast.profile_id
            WHERE ia.id = installed_app_id
            AND p.auth_user_id = (select auth.uid())
        )
    );

CREATE POLICY "App owners can manage their webhooks" ON app_webhooks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM installed_apps ia
            JOIN affiliate_stores ast ON ast.id = ia.store_id
            JOIN profiles p ON p.id = ast.profile_id
            WHERE ia.id = installed_app_id
            AND p.auth_user_id = (select auth.uid())
        )
    );

CREATE POLICY "Users can manage their own reviews" ON app_reviews
    FOR ALL USING (user_id = (select auth.uid()));

CREATE POLICY "Developers can manage their own apps"
ON public.marketplace_apps FOR ALL
USING ((select auth.uid()) = developer_id);

CREATE POLICY "Store owners can install apps"
ON public.installed_apps FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.affiliate_stores
    WHERE id = store_id
    AND profile_id = (select auth.uid())
  )
);

CREATE POLICY "Store owners can update their installed apps"
ON public.installed_apps FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.affiliate_stores
    WHERE id = installed_apps.store_id
    AND profile_id = (select auth.uid())
  )
);

CREATE POLICY "Store owners can uninstall apps"
ON public.installed_apps FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.affiliate_stores
    WHERE id = installed_apps.store_id
    AND profile_id = (select auth.uid())
  )
);

CREATE POLICY "Store owners can manage their API keys"
ON public.app_api_keys FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.installed_apps ia
    JOIN public.affiliate_stores s ON ia.store_id = s.id
    WHERE ia.id = app_api_keys.installed_app_id
    AND s.profile_id = (select auth.uid())
  )
);

CREATE POLICY "Store owners can manage their webhooks"
ON public.app_webhooks FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.installed_apps ia
    JOIN public.affiliate_stores s ON ia.store_id = s.id
    WHERE ia.id = app_webhooks.installed_app_id
    AND s.profile_id = (select auth.uid())
  )
);

CREATE POLICY "Store owners can view their webhook logs"
ON public.app_webhook_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.installed_apps ia
    JOIN public.affiliate_stores s ON ia.store_id = s.id
    WHERE ia.id = app_webhook_logs.installed_app_id
    AND s.profile_id = (select auth.uid())
  )
);

CREATE POLICY "Store owners can create reviews"
ON public.app_reviews FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.affiliate_stores
    WHERE id = store_id
    AND profile_id = (select auth.uid())
  )
);

CREATE POLICY "Users can update their own reviews"
ON public.app_reviews FOR UPDATE
USING (user_id = (select auth.uid()));

CREATE POLICY "Store owners can manage their events"
ON public.app_events FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.affiliate_stores
    WHERE id = app_events.store_id
    AND profile_id = (select auth.uid())
  )
);

CREATE POLICY "Users can view own agreements"
ON public.affiliate_agreements
FOR SELECT
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own agreements"
ON public.affiliate_agreements
FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can view their own wishlist"
ON public.user_wishlists FOR SELECT
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can add to their own wishlist"
ON public.user_wishlists FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can remove from their own wishlist"
ON public.user_wishlists FOR DELETE
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can view their own compare list"
ON public.user_compare_lists FOR SELECT
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can add to their own compare list"
ON public.user_compare_lists FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can remove from their own compare list"
ON public.user_compare_lists FOR DELETE
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can view own level" ON atlantis_user_levels
  FOR SELECT USING ((select auth.uid())::text = user_id::text OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = atlantis_user_levels.user_id AND profiles.auth_user_id = (select auth.uid())
  ));

CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "System can manage badges" ON user_badges FOR ALL USING ((select auth.jwt()) ->> 'role' = 'service_role');

CREATE POLICY "Users can view their own level" ON atlantis_user_levels
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Anyone can view active badges" ON badges
  FOR SELECT USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM user_badges
      WHERE user_badges.badge_id = badges.id AND user_badges.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can manage badges" ON badges
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
  ));

CREATE POLICY "Users can view their own badges" ON user_badges
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Merchants can view their own pending balance"
ON public.merchant_pending_balance
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = merchant_pending_balance.merchant_id
        AND p.auth_user_id = (select auth.uid())
    )
);

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth_user_id = (select auth.uid()));

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth_user_id = (select auth.uid()))
WITH CHECK (auth_user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = (select auth.uid()));

-- ============================================
-- Fix Duplicate Index (from Supabase Performance Security Lints CSV)
-- Drop redundant indexes - keep one per group
-- ============================================
DROP INDEX IF EXISTS public.idx_cms_widgets_page_id;
DROP INDEX IF EXISTS public.idx_cms_pages_affiliate_store_id;
DROP INDEX IF EXISTS public.idx_drafts_created_by;
DROP INDEX IF EXISTS public.idx_drafts_page_id;
DROP INDEX IF EXISTS public.idx_coupons_shop;
DROP INDEX IF EXISTS public.idx_customers_profile;
DROP INDEX IF EXISTS public.idx_order_items_order_id;
DROP INDEX IF EXISTS public.idx_orders_created_at;
DROP INDEX IF EXISTS public.idx_payments_order_id;
DROP INDEX IF EXISTS public.idx_email_campaigns_shop;
DROP INDEX IF EXISTS public.idx_inventory_movements_creator;
DROP INDEX IF EXISTS public.idx_inventory_movements_variant_id;
DROP INDEX IF EXISTS public.idx_inventory_variant_id;
DROP INDEX IF EXISTS public.idx_inventory_movements_warehouse_product_id;
DROP INDEX IF EXISTS public.idx_inventory_warehouse_product_id;
DROP INDEX IF EXISTS public.idx_lead_activities_lead;
DROP INDEX IF EXISTS public.idx_leads_assigned;
DROP INDEX IF EXISTS public.idx_order_hub_affiliate_store;
DROP INDEX IF EXISTS public.idx_order_hub_shop;
DROP INDEX IF EXISTS public.idx_orders_shop;
DROP INDEX IF EXISTS public.idx_returns_order_hub;
DROP INDEX IF EXISTS public.idx_reviews_product_id;
DROP INDEX IF EXISTS public.idx_reviews_user_id;
DROP INDEX IF EXISTS public.idx_product_variants_product_id;
DROP INDEX IF EXISTS public.idx_variants_product;
DROP INDEX IF EXISTS public.idx_variants_product_id;
DROP INDEX IF EXISTS public.idx_variants_warehouse_product_id;
DROP INDEX IF EXISTS public.idx_products_is_active;
DROP INDEX IF EXISTS public.idx_products_image_urls_gin;
DROP INDEX IF EXISTS public.idx_products_tags_gin;
DROP INDEX IF EXISTS public.idx_promotion_campaigns_created_by;
DROP INDEX IF EXISTS public.idx_promotion_campaigns_store_id;
DROP INDEX IF EXISTS public.idx_promotional_banners_created_by;
DROP INDEX IF EXISTS public.idx_banners_store_id;
DROP INDEX IF EXISTS public.idx_promo_banners_store_id;
DROP INDEX IF EXISTS public.idx_promotional_banners_store_id;
DROP INDEX IF EXISTS public.idx_referral_commissions_store;
DROP INDEX IF EXISTS public.idx_refunds_created_at;
DROP INDEX IF EXISTS public.idx_refunds_order_hub;
DROP INDEX IF EXISTS public.idx_shipping_zones_postal_codes_gin;
DROP INDEX IF EXISTS public.idx_shops_owner;
DROP INDEX IF EXISTS public.idx_simple_items_product;
DROP INDEX IF EXISTS public.idx_simple_items_product_id;
DROP INDEX IF EXISTS public.idx_social_media_accounts_shop_id;
DROP INDEX IF EXISTS public.idx_settings_shop_id;
DROP INDEX IF EXISTS public.idx_user_themes_store_id;
DROP INDEX IF EXISTS public.idx_user_custom_themes_user_id;
DROP INDEX IF EXISTS public.idx_theme_customizations_store_id;
DROP INDEX IF EXISTS public.idx_visual_themes_store_id;
-- لا نُسقط zoho_sync_settings_shop_id_unique لأنه قيد UNIQUE وليس فهرساً مستقلاً
