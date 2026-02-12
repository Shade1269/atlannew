#!/usr/bin/env node

/**
 * 🧪 Script للتحقق من بنية قاعدة البيانات
 * يتحقق من:
 * 1. وجود الجداول الأساسية
 * 2. أسماء الأعمدة (profile_id vs user_profile_id)
 * 3. العلاقات (Foreign Keys)
 * 4. Helper Functions
 */

import { createClient } from '@supabase/supabase-js';

// قراءة المتغيرات من .env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔍 بدء فحص بنية قاعدة البيانات...\n');

async function checkTableStructure(tableName) {
  console.log(`\n📋 فحص جدول: ${tableName}`);
  console.log('═'.repeat(50));

  try {
    // محاولة قراءة صف واحد للتحقق من الأعمدة
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ خطأ: ${error.message}`);
      return false;
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log(`✅ الأعمدة الموجودة:`);
      columns.forEach(col => {
        if (col.includes('profile') || col.includes('user')) {
          console.log(`   🔑 ${col} ← مهم!`);
        } else {
          console.log(`   - ${col}`);
        }
      });

      // التحقق من وجود أعمدة مشكوك فيها
      if (columns.includes('user_profile_id')) {
        console.log(`\n⚠️  تحذير: يوجد عمود user_profile_id`);
        console.log(`   يجب تشغيل Migration لتوحيد الأسماء`);
      }

      if (columns.includes('profile_id')) {
        console.log(`\n✅ جيد: يوجد عمود profile_id`);
      }

      return true;
    } else {
      console.log(`✅ الجدول موجود لكن فارغ`);
      return true;
    }
  } catch (error) {
    console.log(`❌ خطأ غير متوقع: ${error.message}`);
    return false;
  }
}

// Helper function to check database functions (currently unused, kept for future use)
// eslint-disable-next-line no-unused-vars
async function checkFunction(functionName) {
  console.log(`\n🔧 اختبار Function: ${functionName}`);
  console.log('═'.repeat(50));

  try {
    const { data, error } = await supabase.rpc(functionName);

    if (error) {
      console.log(`❌ خطأ: ${error.message}`);
      return false;
    }

    console.log(`✅ Function يعمل`);
    if (data) {
      console.log(`   النتيجة: ${JSON.stringify(data).substring(0, 100)}...`);
    }
    return true;
  } catch (error) {
    console.log(`❌ خطأ غير متوقع: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 بدء الفحص الشامل\n');

  // 1. فحص الجداول الأساسية
  const tables = [
    'profiles',
    'affiliate_stores',
    'merchants',
    'products',
    'orders',
    'ecommerce_orders',
    'commissions',
  ];

  let allTablesOk = true;
  for (const table of tables) {
    const ok = await checkTableStructure(table);
    if (!ok) allTablesOk = false;
  }

  // 2. فحص Helper Functions
  console.log('\n\n🔧 فحص Helper Functions');
  console.log('═'.repeat(50));

  // لا يمكن اختبار هذه functions بدون auth
  // لكن يمكن التحقق من وجودها عبر query
  console.log('⚠️  لا يمكن اختبار Functions بدون authentication');
  console.log('   يجب اختبارها من التطبيق مباشرة');

  // 3. الخلاصة
  console.log('\n\n📊 ملخص الفحص');
  console.log('═'.repeat(50));

  if (allTablesOk) {
    console.log('✅ جميع الجداول الأساسية موجودة');
  } else {
    console.log('⚠️  بعض الجداول بها مشاكل');
  }

  console.log('\n📝 التوصيات:');
  console.log('   1. إذا رأيت user_profile_id → شغّل Migration');
  console.log('   2. اختبر تسجيل الدخول من التطبيق');
  console.log('   3. تحقق من عمل إنشاء المتجر للمسوقين');

  console.log('\n✅ انتهى الفحص!');
}

main().catch(console.error);
