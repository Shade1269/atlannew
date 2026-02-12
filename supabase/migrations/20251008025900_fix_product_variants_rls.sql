
DROP POLICY IF EXISTS "Users can manage their product variants" ON product_variants_advanced;
DROP POLICY IF EXISTS "Users can manage their product media" ON product_media;
DROP POLICY IF EXISTS "Users can manage their product discounts" ON product_discounts;
DROP POLICY IF EXISTS "Users can manage their product SEO" ON product_seo;
DROP POLICY IF EXISTS "Users can manage their product shipping" ON product_shipping;

CREATE POLICY "Users can manage their product variants" ON product_variants_advanced
  FOR ALL USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN merchants m ON p.merchant_id = m.id
      JOIN profiles prof ON m.profile_id = prof.id
      WHERE prof.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their product media" ON product_media
  FOR ALL USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN merchants m ON p.merchant_id = m.id
      JOIN profiles prof ON m.profile_id = prof.id
      WHERE prof.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their product discounts" ON product_discounts
  FOR ALL USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN merchants m ON p.merchant_id = m.id
      JOIN profiles prof ON m.profile_id = prof.id
      WHERE prof.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their product SEO" ON product_seo
  FOR ALL USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN merchants m ON p.merchant_id = m.id
      JOIN profiles prof ON m.profile_id = prof.id
      WHERE prof.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their product shipping" ON product_shipping
  FOR ALL USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN merchants m ON p.merchant_id = m.id
      JOIN profiles prof ON m.profile_id = prof.id
      WHERE prof.auth_user_id = auth.uid()
    )
  );
