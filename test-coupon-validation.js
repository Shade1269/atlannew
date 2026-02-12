/**
 * 🧪 سكريبت اختبار سريع لنظام الكوبونات
 *
 * هذا السكريبت يمكن تشغيله في Browser Console لاختبار
 * منطق التحقق من الكوبونات بدون الحاجة للواجهة
 */

// 🎯 بيانات كوبونات تجريبية
const testCoupons = {
  WELCOME20: {
    id: 'test-1',
    coupon_code: 'WELCOME20',
    coupon_name: 'خصم ترحيبي 20%',
    discount_type: 'percentage',
    discount_value: 20,
    minimum_order_amount: 100,
    maximum_discount_amount: 200,
    valid_from: new Date('2025-01-01'),
    valid_until: new Date('2025-12-31'),
    usage_limit: 100,
    usage_count: 5,
    is_active: true
  },
  SAVE50: {
    id: 'test-2',
    coupon_code: 'SAVE50',
    coupon_name: 'خصم 50 ريال',
    discount_type: 'fixed',
    discount_value: 50,
    minimum_order_amount: 200,
    maximum_discount_amount: null,
    valid_from: new Date('2025-01-01'),
    valid_until: new Date('2025-12-31'),
    usage_limit: 50,
    usage_count: 10,
    is_active: true
  },
  VIP30: {
    id: 'test-3',
    coupon_code: 'VIP30',
    coupon_name: 'خصم VIP 30%',
    discount_type: 'percentage',
    discount_value: 30,
    minimum_order_amount: 0,
    maximum_discount_amount: 500,
    valid_from: new Date('2025-01-01'),
    valid_until: new Date('2025-12-31'),
    usage_limit: 20,
    usage_count: 2,
    is_active: true
  },
  EXPIRED10: {
    id: 'test-4',
    coupon_code: 'EXPIRED10',
    coupon_name: 'كوبون منتهي',
    discount_type: 'percentage',
    discount_value: 10,
    minimum_order_amount: 0,
    maximum_discount_amount: null,
    valid_from: new Date('2024-01-01'),
    valid_until: new Date('2024-12-31'), // منتهي
    usage_limit: 100,
    usage_count: 0,
    is_active: true
  },
  LIMITED5: {
    id: 'test-5',
    coupon_code: 'LIMITED5',
    coupon_name: 'كوبون محدود',
    discount_type: 'fixed',
    discount_value: 25,
    minimum_order_amount: 0,
    maximum_discount_amount: null,
    valid_from: new Date('2025-01-01'),
    valid_until: new Date('2025-12-31'),
    usage_limit: 5,
    usage_count: 5, // مستنفذ
    is_active: true
  }
};

// 🧮 دالة حساب الخصم (نسخة من الكود الفعلي)
function calculateDiscount(coupon, subtotal) {
  if (!coupon) return 0;

  let discount = 0;

  if (coupon.discount_type === 'percentage') {
    discount = (subtotal * coupon.discount_value) / 100;

    // تطبيق الحد الأقصى للخصم
    if (coupon.maximum_discount_amount && discount > coupon.maximum_discount_amount) {
      discount = coupon.maximum_discount_amount;
    }
  } else {
    // fixed amount
    discount = coupon.discount_value;
  }

  // لا يتجاوز الخصم قيمة المنتجات
  return Math.min(discount, subtotal);
}

// ✅ دالة التحقق من صحة الكوبون
function validateCoupon(couponCode, subtotal) {
  const coupon = testCoupons[couponCode];

  if (!coupon) {
    return {
      valid: false,
      error: 'الكوبون المدخل غير موجود أو غير نشط'
    };
  }

  const now = new Date();

  // التحقق من صلاحية التاريخ
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return {
      valid: false,
      error: 'هذا الكوبون لم يبدأ بعد'
    };
  }

  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return {
      valid: false,
      error: 'انتهت صلاحية هذا الكوبون'
    };
  }

  // التحقق من الحد الأدنى للطلب
  if (coupon.minimum_order_amount && subtotal < coupon.minimum_order_amount) {
    return {
      valid: false,
      error: `يجب أن يكون مجموع الطلب ${coupon.minimum_order_amount} ريال على الأقل`
    };
  }

  // التحقق من حد الاستخدام
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    return {
      valid: false,
      error: 'تم استخدام هذا الكوبون بالكامل'
    };
  }

  const discount = calculateDiscount(coupon, subtotal);

  return {
    valid: true,
    coupon: coupon,
    discount: discount,
    message: `تم تطبيق خصم ${coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value} ريال`}`
  };
}

// 🧪 حالات الاختبار
const testCases = [
  // ✅ حالات نجاح
  {
    name: 'WELCOME20 مع طلب 300 ريال',
    couponCode: 'WELCOME20',
    subtotal: 300,
    expectedDiscount: 60, // 20% من 300
    shouldPass: true
  },
  {
    name: 'WELCOME20 مع طلب 1500 ريال (اختبار الحد الأقصى)',
    couponCode: 'WELCOME20',
    subtotal: 1500,
    expectedDiscount: 200, // الحد الأقصى
    shouldPass: true
  },
  {
    name: 'SAVE50 مع طلب 250 ريال',
    couponCode: 'SAVE50',
    subtotal: 250,
    expectedDiscount: 50,
    shouldPass: true
  },
  {
    name: 'VIP30 مع طلب 50 ريال (بدون حد أدنى)',
    couponCode: 'VIP30',
    subtotal: 50,
    expectedDiscount: 15, // 30% من 50
    shouldPass: true
  },
  {
    name: 'VIP30 مع طلب 2000 ريال (اختبار الحد الأقصى)',
    couponCode: 'VIP30',
    subtotal: 2000,
    expectedDiscount: 500, // الحد الأقصى
    shouldPass: true
  },

  // ❌ حالات فشل
  {
    name: 'WELCOME20 مع طلب 80 ريال (أقل من الحد الأدنى)',
    couponCode: 'WELCOME20',
    subtotal: 80,
    shouldPass: false,
    expectedError: 'يجب أن يكون مجموع الطلب 100 ريال على الأقل'
  },
  {
    name: 'EXPIRED10 (كوبون منتهي)',
    couponCode: 'EXPIRED10',
    subtotal: 200,
    shouldPass: false,
    expectedError: 'انتهت صلاحية هذا الكوبون'
  },
  {
    name: 'LIMITED5 (كوبون مستنفذ)',
    couponCode: 'LIMITED5',
    subtotal: 200,
    shouldPass: false,
    expectedError: 'تم استخدام هذا الكوبون بالكامل'
  },
  {
    name: 'FAKE123 (كوبون غير موجود)',
    couponCode: 'FAKE123',
    subtotal: 200,
    shouldPass: false,
    expectedError: 'الكوبون المدخل غير موجود أو غير نشط'
  }
];

// 🏃 تشغيل الاختبارات
function runTests() {
  console.log('🧪 بدء اختبار نظام الكوبونات...\n');

  let passed = 0;
  let failed = 0;

  testCases.forEach((test, index) => {
    console.log(`\n📋 اختبار ${index + 1}: ${test.name}`);
    console.log(`   الكوبون: ${test.couponCode}`);
    console.log(`   قيمة الطلب: ${test.subtotal} ريال`);

    const result = validateCoupon(test.couponCode, test.subtotal);

    if (test.shouldPass) {
      // يجب أن ينجح
      if (result.valid && result.discount === test.expectedDiscount) {
        console.log(`   ✅ نجح - الخصم: ${result.discount} ريال`);
        console.log(`   💬 ${result.message}`);
        passed++;
      } else {
        console.log(`   ❌ فشل - الخصم المتوقع: ${test.expectedDiscount}، الفعلي: ${result.discount || 0}`);
        if (!result.valid) {
          console.log(`   📝 الخطأ: ${result.error}`);
        }
        failed++;
      }
    } else {
      // يجب أن يفشل
      if (!result.valid && result.error === test.expectedError) {
        console.log(`   ✅ نجح - تم رفض الكوبون كما هو متوقع`);
        console.log(`   📝 ${result.error}`);
        passed++;
      } else {
        console.log(`   ❌ فشل - الخطأ المتوقع: "${test.expectedError}"`);
        console.log(`   📝 الخطأ الفعلي: "${result.error || 'لا يوجد'}"`);
        failed++;
      }
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 نتائج الاختبار:`);
  console.log(`   ✅ نجح: ${passed}/${testCases.length}`);
  console.log(`   ❌ فشل: ${failed}/${testCases.length}`);
  console.log(`   📈 نسبة النجاح: ${((passed / testCases.length) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 رائع! جميع الاختبارات نجحت!');
  } else {
    console.log('\n⚠️ بعض الاختبارات فشلت، يرجى المراجعة.');
  }

  console.log('\n' + '='.repeat(60));
}

// 🎮 دالة اختبار يدوي
function testCoupon(couponCode, orderAmount) {
  console.log('\n' + '='.repeat(60));
  console.log(`🔍 اختبار الكوبون: ${couponCode}`);
  console.log(`💰 قيمة الطلب: ${orderAmount} ريال`);
  console.log('='.repeat(60));

  const result = validateCoupon(couponCode, orderAmount);

  if (result.valid) {
    console.log('\n✅ الكوبون صالح!');
    console.log(`\n📊 التفاصيل:`);
    console.log(`   الكوبون: ${result.coupon.coupon_name}`);
    console.log(`   نوع الخصم: ${result.coupon.discount_type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}`);
    console.log(`   قيمة الخصم: ${result.coupon.discount_value}${result.coupon.discount_type === 'percentage' ? '%' : ' ريال'}`);
    console.log(`\n💵 الحسابات:`);
    console.log(`   المجموع الفرعي: ${orderAmount} ريال`);
    console.log(`   الخصم: -${result.discount} ريال`);
    console.log(`   المجموع بعد الخصم: ${orderAmount - result.discount} ريال`);
    console.log(`\n✨ ${result.message}`);
  } else {
    console.log('\n❌ الكوبون غير صالح!');
    console.log(`\n📝 السبب: ${result.error}`);
  }

  console.log('\n' + '='.repeat(60));

  return result;
}

// 📚 دالة عرض الكوبونات المتاحة
function showAvailableCoupons() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 الكوبونات المتاحة للاختبار:');
  console.log('='.repeat(60));

  Object.values(testCoupons).forEach((coupon, index) => {
    const isExpired = new Date(coupon.valid_until) < new Date();
    const isExhausted = coupon.usage_count >= coupon.usage_limit;

    console.log(`\n${index + 1}. ${coupon.coupon_code}`);
    console.log(`   📝 ${coupon.coupon_name}`);
    console.log(`   💰 ${coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value} ريال`}`);
    console.log(`   📏 الحد الأدنى: ${coupon.minimum_order_amount || 0} ريال`);
    if (coupon.maximum_discount_amount) {
      console.log(`   🔝 الحد الأقصى: ${coupon.maximum_discount_amount} ريال`);
    }
    console.log(`   📊 الاستخدام: ${coupon.usage_count}/${coupon.usage_limit}`);
    console.log(`   📅 صالح حتى: ${new Date(coupon.valid_until).toLocaleDateString('ar-SA')}`);

    if (isExpired) {
      console.log(`   ⚠️ منتهي الصلاحية`);
    } else if (isExhausted) {
      console.log(`   ⚠️ تم استنفاذه`);
    } else {
      console.log(`   ✅ نشط`);
    }
  });

  console.log('\n' + '='.repeat(60));
}

// 🎯 التصدير للاستخدام
console.log('\n' + '='.repeat(60));
console.log('🎫 نظام اختبار الكوبونات جاهز!');
console.log('='.repeat(60));
console.log('\n📚 الأوامر المتاحة:');
console.log('   runTests()                          - تشغيل جميع الاختبارات التلقائية');
console.log('   testCoupon("WELCOME20", 300)        - اختبار كوبون محدد');
console.log('   showAvailableCoupons()              - عرض جميع الكوبونات المتاحة');
console.log('   calculateDiscount(coupon, subtotal) - حساب الخصم يدوياً');
console.log('\n💡 مثال:');
console.log('   testCoupon("WELCOME20", 300)');
console.log('\n' + '='.repeat(60) + '\n');

// تصدير الدوال
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateCoupon,
    calculateDiscount,
    runTests,
    testCoupon,
    showAvailableCoupons,
    testCoupons
  };
}
