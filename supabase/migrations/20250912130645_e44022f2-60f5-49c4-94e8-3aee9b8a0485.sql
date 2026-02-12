-- إنشاء RLS Policies لجداول التجارة الإلكترونية

-- ===== عناوين الشحن =====
-- المستخدمون يمكنهم إدارة عناوينهم فقط
CREATE POLICY "Users can manage their shipping addresses" ON public.shipping_addresses
  FOR ALL USING (user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- ===== عربة التسوق =====
-- المستخدمون يمكنهم إدارة عربة التسوق الخاصة بهم
CREATE POLICY "Users can manage their shopping cart" ON public.shopping_carts
  FOR ALL USING (
    user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    OR session_id IS NOT NULL -- للمستخدمين غير المسجلين
  );

-- ===== عناصر عربة التسوق =====
-- المستخدمون يمكنهم إدارة عناصر عربة التسوق الخاصة بهم
CREATE POLICY "Users can manage their cart items" ON public.cart_items
  FOR ALL USING (
    cart_id IN (
      SELECT id FROM shopping_carts sc 
      WHERE sc.user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
      OR sc.session_id IS NOT NULL
    )
  );

-- ===== الطلبات =====
-- العملاء يمكنهم عرض طلباتهم فقط
CREATE POLICY "Customers can view their orders" ON public.ecommerce_orders
  FOR SELECT USING (user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- أصحاب المتاجر يمكنهم إدارة طلبات متاجرهم
CREATE POLICY "Shop owners can manage their shop orders" ON public.ecommerce_orders
  FOR ALL USING (
    shop_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = auth.uid()
    )
  );

-- المدراء يمكنهم إدارة جميع الطلبات
CREATE POLICY "Admins can manage all orders" ON public.ecommerce_orders
  FOR ALL USING (get_current_user_role() = 'admin');

-- المستخدمون المسجلون يمكنهم إنشاء طلبات جديدة
CREATE POLICY "Authenticated users can create orders" ON public.ecommerce_orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ===== عناصر الطلبات =====
-- العملاء يمكنهم عرض عناصر طلباتهم
CREATE POLICY "Customers can view their order items" ON public.ecommerce_order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM ecommerce_orders 
      WHERE user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    )
  );

-- أصحاب المتاجر يمكنهم إدارة عناصر طلبات متاجرهم
CREATE POLICY "Shop owners can manage their order items" ON public.ecommerce_order_items
  FOR ALL USING (
    order_id IN (
      SELECT eo.id FROM ecommerce_orders eo 
      JOIN shops s ON s.id = eo.shop_id
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = auth.uid()
    )
  );

-- المدراء يمكنهم إدارة جميع عناصر الطلبات
CREATE POLICY "Admins can manage all order items" ON public.ecommerce_order_items
  FOR ALL USING (get_current_user_role() = 'admin');

-- المستخدمون المسجلون يمكنهم إضافة عناصر للطلبات
CREATE POLICY "Authenticated users can add order items" ON public.ecommerce_order_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ===== تاريخ حالات الطلبات =====
-- العملاء يمكنهم عرض تاريخ حالات طلباتهم
CREATE POLICY "Customers can view their order status history" ON public.order_status_history
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM ecommerce_orders 
      WHERE user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    )
  );

-- أصحاب المتاجر والمدراء يمكنهم إدارة تاريخ حالات الطلبات
CREATE POLICY "Shop owners and admins can manage order status history" ON public.order_status_history
  FOR ALL USING (
    get_current_user_role() = ANY(ARRAY['admin', 'merchant']) OR
    order_id IN (
      SELECT eo.id FROM ecommerce_orders eo 
      JOIN shops s ON s.id = eo.shop_id
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = auth.uid()
    )
  );