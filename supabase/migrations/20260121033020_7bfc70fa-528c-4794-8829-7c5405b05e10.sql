-- تحديث الطلب الأخير لاختبار trigger العمولات
UPDATE ecommerce_orders 
SET payment_status = 'PAID', updated_at = NOW()
WHERE id = '6355ecb0-3855-411a-9d48-f5bcc70022d3';