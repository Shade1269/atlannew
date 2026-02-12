# process-affiliate-order Edge Function

## الوصف
Edge Function لمعالجة طلبات الأفيليت. يستدعي دالة RPC `process_affiliate_order` لمعالجة الطلب في قاعدة البيانات.

## طريقة الاستدعاء
```http
POST /functions/v1/process-affiliate-order
Content-Type: application/json
```

## المدخلات (Request Body)
```typescript
{
  session_id: string;            // معرف الجلسة (مطلوب)
  affiliate_store_id: string;    // معرف متجر الأفيليت (مطلوب)
  order_items: Array<{           // عناصر الطلب (مطلوب)
    product_id: string;
    quantity: number;
    price: number;
  }>;
}
```

## المخرجات (Response)
### نجاح (200)
```json
{
  "success": true,
  "order_id": "uuid",
  "message": "تم معالجة الطلب بنجاح"
}
```

### خطأ (500)
```json
{
  "success": false,
  "error": "رسالة الخطأ"
}
```

## التكاملات
- يستدعي RPC: `process_affiliate_order(p_session_id, p_affiliate_store_id, p_order_items)`

## متغيرات البيئة المطلوبة
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## ملاحظات
- يتم التحقق من جميع البيانات المطلوبة قبل معالجة الطلب
- يتم تسجيل الأخطاء في console للتتبع
