# create-ecommerce-order Edge Function

## الوصف
Edge Function لإنشاء طلبات التجارة الإلكترونية. يدعم نوعين من الطلبات:
- **السلة (Cart-based)**: عند تمرير `cart_id`
- **طلب مباشر (Direct)**: عند تمرير مصفوفة `items`

## طريقة الاستدعاء
```http
POST /functions/v1/create-ecommerce-order
Content-Type: application/json
```

## المدخلات (Request Body)
```typescript
{
  cart_id?: string;              // معرف السلة (اختياري)
  shop_id?: string;              // معرف المتجر (يتم اشتقاقه تلقائياً)
  affiliate_store_id: string;    // معرف متجر الأفيليت (مطلوب)
  buyer_session_id?: string;     // معرف جلسة المشتري
  customer: {
    name: string;                // اسم العميل (مطلوب)
    phone: string;               // رقم الهاتف (مطلوب)
    email?: string;
    address?: {
      city: string;
      district?: string;
      street?: string;
      building?: string;
      apartment?: string;
      postalCode?: string;
    }
  };
  shipping?: {
    provider_name?: string;
    cost_sar?: number;           // افتراضي: 25
  };
  items?: Array<{                // للطلبات المباشرة فقط
    id: string;
    quantity: number;
    price: number;
  }>;
  payment_method?: string;       // افتراضي: "CASH_ON_DELIVERY"
}
```

## المخرجات (Response)
### نجاح (200)
```json
{
  "success": true,
  "order_id": "uuid",
  "order_number": "ORD-...",
  "tracking_number": "TRK-..."
}
```

### خطأ (400/500)
```json
{
  "success": false,
  "error": "رسالة الخطأ"
}
```

## التكاملات
- ✅ يحفظ في `ecommerce_orders` و `ecommerce_order_items`
- ✅ يسجل في `order_hub` الموحد
- ✅ يمسح السلة بعد إتمام الطلب
- ✅ يرسل إلى Zoho Flow إذا كان `ZOHO_FLOW_WEBHOOK_URL` معرفاً

## متغيرات البيئة المطلوبة
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ZOHO_FLOW_WEBHOOK_URL` (اختياري)

## أمثلة

### طلب من سلة
```json
{
  "cart_id": "cart-uuid",
  "affiliate_store_id": "store-uuid",
  "customer": { "name": "أحمد", "phone": "05xxxxxxxx" }
}
```

### طلب مباشر
```json
{
  "affiliate_store_id": "store-uuid",
  "items": [{ "id": "product-uuid", "quantity": 2, "price": 99 }],
  "customer": { "name": "أحمد", "phone": "05xxxxxxxx" }
}
```
