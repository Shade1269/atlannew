-- تفعيل RLS على الجداول (إن لم تكن مفعلة)
ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_coupon_usage ENABLE ROW LEVEL SECURITY;

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user_id ON public.shipping_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_default ON public.shipping_addresses(user_id, is_default) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_shopping_carts_user_id ON public.shopping_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_session_id ON public.shopping_carts(session_id);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_expires_at ON public.shopping_carts(expires_at);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);

CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_user_id ON public.ecommerce_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_shop_id ON public.ecommerce_orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_status ON public.ecommerce_orders(status);
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_created_at ON public.ecommerce_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_order_number ON public.ecommerce_orders(order_number);

CREATE INDEX IF NOT EXISTS idx_ecommerce_order_items_order_id ON public.ecommerce_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_order_items_product_id ON public.ecommerce_order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON public.order_status_history(created_at);

CREATE INDEX IF NOT EXISTS idx_ecommerce_payment_transactions_order_id ON public.ecommerce_payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_payment_transactions_status ON public.ecommerce_payment_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_ecommerce_payment_transactions_transaction_id ON public.ecommerce_payment_transactions(transaction_id);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON public.product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved ON public.product_reviews(is_approved) WHERE is_approved = true;

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON public.wishlists(product_id);

CREATE INDEX IF NOT EXISTS idx_ecommerce_coupon_usage_coupon_id ON public.ecommerce_coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_coupon_usage_order_id ON public.ecommerce_coupon_usage(order_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_coupon_usage_user_id ON public.ecommerce_coupon_usage(user_id);