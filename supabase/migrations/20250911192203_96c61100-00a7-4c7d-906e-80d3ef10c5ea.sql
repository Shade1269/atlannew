-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (get_current_user_role() = 'admin');

CREATE POLICY "Anyone can create profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- RLS Policies for merchants
CREATE POLICY "Merchants can view their own data" ON public.merchants
    FOR SELECT USING (user_profile_id = get_current_user_profile_id());

CREATE POLICY "Merchants can update their own data" ON public.merchants
    FOR UPDATE USING (user_profile_id = get_current_user_profile_id());

CREATE POLICY "Merchants can create their profile" ON public.merchants
    FOR INSERT WITH CHECK (user_profile_id = get_current_user_profile_id());

CREATE POLICY "Admins can manage all merchants" ON public.merchants
    FOR ALL USING (get_current_user_role() = 'admin');

-- RLS Policies for affiliate_stores
CREATE POLICY "Affiliates can manage their stores" ON public.affiliate_stores
    FOR ALL USING (user_profile_id = get_current_user_profile_id());

CREATE POLICY "Public can view active stores" ON public.affiliate_stores
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all stores" ON public.affiliate_stores
    FOR ALL USING (get_current_user_role() = 'admin');

-- RLS Policies for products
CREATE POLICY "Merchants can manage their products" ON public.products
    FOR ALL USING (
        merchant_id IN (
            SELECT id FROM public.merchants 
            WHERE user_profile_id = get_current_user_profile_id()
        )
    );

CREATE POLICY "Public can view active products" ON public.products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all products" ON public.products
    FOR ALL USING (get_current_user_role() = 'admin');

-- RLS Policies for affiliate_products
CREATE POLICY "Affiliates can manage their product selections" ON public.affiliate_products
    FOR ALL USING (
        affiliate_store_id IN (
            SELECT id FROM public.affiliate_stores 
            WHERE user_profile_id = get_current_user_profile_id()
        )
    );

CREATE POLICY "Public can view affiliate products" ON public.affiliate_products
    FOR SELECT USING (is_visible = true);

-- RLS Policies for orders
CREATE POLICY "Customers can view their orders" ON public.orders
    FOR SELECT USING (customer_profile_id = get_current_user_profile_id());

CREATE POLICY "Affiliates can view their store orders" ON public.orders
    FOR SELECT USING (
        affiliate_store_id IN (
            SELECT id FROM public.affiliate_stores 
            WHERE user_profile_id = get_current_user_profile_id()
        )
    );

CREATE POLICY "Merchants can view their product orders" ON public.orders
    FOR SELECT USING (
        id IN (
            SELECT DISTINCT oi.order_id 
            FROM public.order_items oi
            JOIN public.merchants m ON m.id = oi.merchant_id
            WHERE m.user_profile_id = get_current_user_profile_id()
        )
    );

CREATE POLICY "Anyone can create orders" ON public.orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all orders" ON public.orders
    FOR ALL USING (get_current_user_role() = 'admin');

-- RLS Policies for order_items
CREATE POLICY "Users can view order items of their orders" ON public.order_items
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM public.orders 
            WHERE customer_profile_id = get_current_user_profile_id()
            OR affiliate_store_id IN (
                SELECT id FROM public.affiliate_stores 
                WHERE user_profile_id = get_current_user_profile_id()
            )
            OR id IN (
                SELECT DISTINCT oi.order_id 
                FROM public.order_items oi
                JOIN public.merchants m ON m.id = oi.merchant_id
                WHERE m.user_profile_id = get_current_user_profile_id()
            )
        )
    );

CREATE POLICY "Anyone can create order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all order items" ON public.order_items
    FOR ALL USING (get_current_user_role() = 'admin');

-- RLS Policies for commissions
CREATE POLICY "Affiliates can view their commissions" ON public.commissions
    FOR SELECT USING (affiliate_profile_id = get_current_user_profile_id());

CREATE POLICY "Merchants can view commissions for their products" ON public.commissions
    FOR SELECT USING (
        merchant_id IN (
            SELECT id FROM public.merchants 
            WHERE user_profile_id = get_current_user_profile_id()
        )
    );

CREATE POLICY "System can create commissions" ON public.commissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all commissions" ON public.commissions
    FOR ALL USING (get_current_user_role() = 'admin');

-- RLS Policies for points_transactions
CREATE POLICY "Users can view their points transactions" ON public.points_transactions
    FOR SELECT USING (user_profile_id = get_current_user_profile_id());

CREATE POLICY "System can create points transactions" ON public.points_transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all points transactions" ON public.points_transactions
    FOR ALL USING (get_current_user_role() = 'admin');

-- RLS Policies for campaign_links
CREATE POLICY "Affiliates can manage their campaign links" ON public.campaign_links
    FOR ALL USING (
        affiliate_store_id IN (
            SELECT id FROM public.affiliate_stores 
            WHERE user_profile_id = get_current_user_profile_id()
        )
    );

CREATE POLICY "Admins can manage all campaign links" ON public.campaign_links
    FOR ALL USING (get_current_user_role() = 'admin');

-- RLS Policies for product_reviews
CREATE POLICY "Public can view verified reviews" ON public.product_reviews
    FOR SELECT USING (is_verified = true);

CREATE POLICY "Customers can create reviews for their purchases" ON public.product_reviews
    FOR INSERT WITH CHECK (customer_profile_id = get_current_user_profile_id());

CREATE POLICY "Customers can view their reviews" ON public.product_reviews
    FOR SELECT USING (customer_profile_id = get_current_user_profile_id());

CREATE POLICY "Admins can manage all reviews" ON public.product_reviews
    FOR ALL USING (get_current_user_role() = 'admin');

-- RLS Policies for wishlists
CREATE POLICY "Customers can manage their wishlists" ON public.wishlists
    FOR ALL USING (customer_profile_id = get_current_user_profile_id());

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their support tickets" ON public.support_tickets
    FOR SELECT USING (user_profile_id = get_current_user_profile_id());

CREATE POLICY "Users can create support tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (user_profile_id = get_current_user_profile_id());

CREATE POLICY "Admins can manage all support tickets" ON public.support_tickets
    FOR ALL USING (get_current_user_role() = 'admin');