import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getSupabaseAdminClient } from '../_shared/supabase.ts';

// Helper: paginate through auth users to find a user by phone
async function findUserByPhone(supabase: any, phone: string) {
  for (let page = 1; page <= 12; page++) {
    const { data: pageData } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    const user = pageData?.users?.find((u: any) => u.phone === phone);
    if (user) return user;
    if (!pageData || !pageData.users || pageData.users.length === 0) break;
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // استخدام Supabase Admin Client المشترك
    const supabase = getSupabaseAdminClient();

    const { phone, otp, role, referral_code } = await req.json();

    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ success: false, error: 'رقم الجوال ورمز التحقق مطلوبان' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // إذا كان هناك referral_code، يجب أن يكون الدور affiliate (مسوق)
    let finalRole = role;
    if (referral_code && !role) {
      finalRole = 'affiliate';
    } else if (referral_code && role !== 'affiliate') {
      // إذا كان هناك referral_code، نحدد الدور تلقائياً كـ affiliate
      finalRole = 'affiliate';
      console.log('Referral code detected, setting role to affiliate');
    }

    // التحقق من الدور: للمستخدمين الجدد يجب اختيار affiliate أو merchant
    // للمستخدمين الموجودين، نقبل أي دور (customer, affiliate, merchant)
    const validNewUserRoles = ['affiliate', 'merchant'];
    const validExistingUserRoles = ['affiliate', 'merchant', 'customer', 'admin', 'moderator'];

    if (!finalRole || !validExistingUserRoles.includes(finalRole)) {
      return new Response(
        JSON.stringify({ success: false, error: 'دور غير صالح' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verifying platform OTP for:', phone, 'with role:', finalRole, 'referral_code:', referral_code);

    // البحث عن profile المحيل إذا كان هناك referral_code
    let referrerProfileId: string | null = null;
    if (referral_code) {
      const { data: referrerProfile, error: referrerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', referral_code)
        .maybeSingle();

      if (referrerError) {
        console.error('Error fetching referrer profile:', referrerError);
      } else if (referrerProfile) {
        referrerProfileId = referrerProfile.id;
        console.log('Found referrer profile:', referrerProfileId);
      } else {
        console.warn('Referral code not found:', referral_code);
      }
    }

    // الحصول على سجل OTP من قاعدة البيانات
    const { data: otpRecord, error: otpError } = await supabase
      .from('whatsapp_otp')
      .select('*')
      .eq('phone', phone)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpRecord) {
      console.error('OTP record not found:', otpError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'رمز التحقق غير صحيح أو منتهي الصلاحية'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // التحقق من عدد المحاولات
    if (otpRecord.attempts >= 5) {
      await supabase
        .from('whatsapp_otp')
        .update({ verified: true })
        .eq('id', otpRecord.id);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'تم تجاوز الحد الأقصى للمحاولات. الرجاء طلب رمز جديد'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let otpVerified = false;
    const preludeApiKey = Deno.env.get('DING_API_KEY');

    // تنظيف الـ OTP المُدخل
    const cleanOtp = otp.trim();
    const cleanStoredOtp = otpRecord.code?.trim();

    console.log('Comparing OTP - Input:', cleanOtp, 'Stored:', cleanStoredOtp);

    // التحقق من وضع التطوير
    const isDevelopment = Deno.env.get('DISABLE_PHONE_VERIFICATION') === 'true';

    if (isDevelopment) {
      console.log('🔓 Development mode: Phone verification disabled, accepting any OTP');
      otpVerified = true;
    } else if (preludeApiKey) {
      // تحقق عبر Prelude API باستخدام target+code
      try {
        console.log('Verifying OTP via Prelude API');
        const preludeCheckUrl = 'https://api.prelude.dev/v2/verification/check';
        let formattedPhone = phone;
        if (!formattedPhone.startsWith('+')) {
          formattedPhone = `+${formattedPhone}`;
        }

        const preludeCheckResponse = await fetch(preludeCheckUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${preludeApiKey}`,
          },
          body: JSON.stringify({
            target: {
              type: 'phone_number',
              value: formattedPhone
            },
            code: cleanOtp,
          }),
        });

        if (preludeCheckResponse.ok) {
          const preludeCheckData = await preludeCheckResponse.json();
          console.log('Prelude verification response:', preludeCheckData);

          if (preludeCheckData.status === 'valid' || preludeCheckData.status === 'succeeded' || preludeCheckData.status === 'success') {
            otpVerified = true;
            console.log('OTP verified successfully via Prelude');
          } else {
            console.log('OTP verification failed via Prelude:', preludeCheckData.status);
          }
        } else {
          console.error('Prelude check failed:', preludeCheckResponse.status);
          // إذا فشل Prelude API، نستخدم التحقق المحلي كـ fallback
          if (cleanStoredOtp === cleanOtp) {
            otpVerified = true;
            console.log('OTP verified via local fallback');
          }
        }
      } catch (preludeError) {
        console.error('Error checking OTP via Prelude:', preludeError);
        // استخدام التحقق المحلي كـ fallback
        if (cleanStoredOtp === cleanOtp) {
          otpVerified = true;
          console.log('OTP verified via local fallback after Prelude error');
        } else {
          console.log('Local fallback failed - OTP mismatch');
        }
      }
    } else {
      // لا يوجد external_id أو Prelude API، استخدام التحقق المحلي
      if (cleanStoredOtp === cleanOtp) {
        otpVerified = true;
        console.log('OTP verified via local check');
      } else {
        console.log('Local check failed - OTP mismatch');
      }
    }

    if (!otpVerified) {
      // زيادة عدد المحاولات الفاشلة
      const newAttempts = (otpRecord.attempts || 0) + 1;
      await supabase
        .from('whatsapp_otp')
        .update({ attempts: newAttempts })
        .eq('id', otpRecord.id);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'رمز التحقق غير صحيح'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('OTP verified successfully');

    // البحث عن profile أولاً
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, auth_user_id, phone')
      .eq('phone', phone)
      .maybeSingle();

    // البحث عن مستخدم في auth.users (مع ترقيم صفحات)
    let existingAuthUser = await findUserByPhone(supabase, phone);

    let userId: string = '';
    let profileId: string = '';
    let session = null;

    // **حالة خاصة**: إذا كان profile موجود بدون auth_user_id لكن auth user موجود
    if (existingProfile && !existingProfile.auth_user_id && existingAuthUser) {
      console.log('Linking orphaned profile to existing auth user');
      userId = existingAuthUser.id;
      profileId = existingProfile.id;

      // ربط الـ profile بالـ auth_user_id وتحديث referred_by إذا كان موجوداً
      const updateData: any = { auth_user_id: userId };
      if (referrerProfileId) {
        updateData.referred_by = referrerProfileId;
      }
      await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profileId);

      // تحديث أو إضافة الدور - استخدام userId (auth_user_id) وليس profileId
      await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: finalRole,
          is_active: true
        }, {
          onConflict: 'user_id,role'
        });

      // إنشاء جلسة
      const tempEmail = existingAuthUser.email || `${phone.replace(/\+/g, '')}@temp.anaqti.sa`;
      if (!existingAuthUser.email) {
        await supabase.auth.admin.updateUserById(userId, {
          email: tempEmail,
          email_confirm: true,
        });
      }

      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: tempEmail,
      });

      if (!linkError && linkData?.properties?.hashed_token) {
        session = {
          email: tempEmail,
          token: linkData.properties.hashed_token,
          email_otp: linkData.properties.email_otp
        };
      } else {
        console.error('Failed to generate session token:', linkError);
      }

    } else if (existingAuthUser) {
      // المستخدم موجود في auth.users
      console.log('Existing auth user found:', existingAuthUser.id);
      userId = existingAuthUser.id;

      // إنشاء أو تحديث profile
      if (!existingProfile) {
        console.log('Creating missing profile for existing user');
        const profileData: any = {
          auth_user_id: userId,
          phone: phone,
          full_name: phone,
          role: finalRole,
          is_active: true,
          points: 0
        };
        if (referrerProfileId) {
          profileData.referred_by = referrerProfileId;
        }
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          return new Response(
            JSON.stringify({ success: false, error: 'فشل في إنشاء الملف الشخصي' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        profileId = newProfile.id;
      } else {
        profileId = existingProfile.id;
        // تحديث referred_by والدور إذا كان موجوداً ولم يكن محدداً مسبقاً
        if (referrerProfileId) {
          const updateData: any = { referred_by: referrerProfileId };
          // تحديث الدور إلى affiliate إذا كان هناك referral_code
          if (referral_code) {
            updateData.role = finalRole;
          }
          await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', profileId)
            .is('referred_by', null);
        }
      }

      // تحديث أو إضافة الدور - استخدام userId (auth_user_id) وليس profileId
      await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: finalRole,
          is_active: true
        }, {
          onConflict: 'user_id,role'
        });

      // إنشاء جلسة
      const tempEmail = existingAuthUser.email || `${phone.replace(/\+/g, '')}@temp.anaqti.sa`;
      if (!existingAuthUser.email) {
        await supabase.auth.admin.updateUserById(userId, {
          email: tempEmail,
          email_confirm: true,
        });
      }

      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: tempEmail,
      });

      if (!linkError && linkData?.properties?.hashed_token) {
        session = {
          email: tempEmail,
          token: linkData.properties.hashed_token,
          email_otp: linkData.properties.email_otp
        };
      } else {
        console.error('Failed to generate session token:', linkError);
      }

    } else {
      // مستخدم جديد - التحقق أولاً من وجود حساب بالبريد المؤقت
      console.log('Checking for existing user account');

      const tempEmail = `${phone.replace(/\+/g, '')}@temp.anaqti.sa`;

      // البحث عن مستخدم موجود بنفس البريد المؤقت
      let existingUserByEmail = null;
      for (let page = 1; page <= 5; page++) {
        const { data: pageData } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
        const user = pageData?.users?.find((u: any) => u.email === tempEmail);
        if (user) {
          existingUserByEmail = user;
          break;
        }
        if (!pageData || !pageData.users || pageData.users.length === 0) break;
      }

      if (existingUserByEmail) {
        // إعادة استخدام الحساب الموجود
        console.log('Reusing existing user with temp email:', existingUserByEmail.id);
        userId = existingUserByEmail.id;

        // تحديث رقم الجوال إذا لم يكن مسجلاً
        if (!existingUserByEmail.phone) {
          await supabase.auth.admin.updateUserById(userId, {
            phone: phone,
            phone_confirm: true,
            user_metadata: { phone, role: finalRole }
          });
        }
      } else {
        // إنشاء حساب جديد فقط إذا لم يكن موجوداً
        console.log('Creating new user account');
        const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: tempEmail,
          password: tempPassword,
          phone: phone,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: {
            phone: phone,
            role: finalRole
          }
        });


        if (authError || !authData.user) {
          if ((authError as any)?.code === 'phone_exists') {
            console.error('Phone exists, finding existing auth user');
            existingAuthUser = await findUserByPhone(supabase, phone);
            if (existingAuthUser) {
              userId = existingAuthUser.id;
              // تأكيد/إنشاء profile
              if (existingProfile && !existingProfile.auth_user_id) {
                const updateData: any = { auth_user_id: userId };
                if (referrerProfileId) {
                  updateData.referred_by = referrerProfileId;
                }
                await supabase.from('profiles').update(updateData).eq('id', existingProfile.id);
                profileId = existingProfile.id;
              } else if (!existingProfile) {
                const profileData: any = {
                  auth_user_id: userId,
                  phone: phone,
                  full_name: phone,
                  role: finalRole,
                  is_active: true,
                  points: 0
                };
                if (referrerProfileId) {
                  profileData.referred_by = referrerProfileId;
                }
                const { data: createdProfile } = await supabase
                  .from('profiles')
                  .insert(profileData)
                  .select()
                  .single();
                profileId = createdProfile?.id ?? null;
              } else {
                profileId = existingProfile.id;
                if (referrerProfileId) {
                  const updateData: any = { referred_by: referrerProfileId };
                  // تحديث الدور إلى affiliate إذا كان هناك referral_code
                  if (referral_code) {
                    updateData.role = finalRole;
                  }
                  await supabase
                    .from('profiles')
                    .update(updateData)
                    .eq('id', profileId)
                    .is('referred_by', null);
                }
              }

              // تحديث/إضافة الدور - استخدام userId (auth_user_id)
              await supabase
                .from('user_roles')
                .upsert({ user_id: userId, role: finalRole, is_active: true }, { onConflict: 'user_id,role' });

              // إنشاء جلسة عبر magic link
              const tempEmail = existingAuthUser.email || `${phone.replace(/\+/g, '')}@temp.anaqti.sa`;
              if (!existingAuthUser.email) {
                await supabase.auth.admin.updateUserById(userId, { email: tempEmail, email_confirm: true });
              }
              const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
                type: 'magiclink',
                email: tempEmail,
              });
              if (!linkError && linkData?.properties?.hashed_token) {
                session = { email: tempEmail, token: linkData.properties.hashed_token, email_otp: linkData.properties.email_otp };
              } else {
                console.error('Failed to generate session token (fallback):', linkError);
              }
            } else {
              console.error('Could not locate existing auth user after phone_exists');
              // Fallback: try to find auth user via profiles table by phone
              const { data: profileWithAuth } = await supabase
                .from('profiles')
                .select('auth_user_id')
                .eq('phone', phone)
                .not('auth_user_id', 'is', null)
                .maybeSingle();

              if (profileWithAuth?.auth_user_id) {
                userId = profileWithAuth.auth_user_id;
                // Ensure role entry exists - استخدام userId (auth_user_id)
                await supabase
                  .from('user_roles')
                  .upsert({ user_id: userId, role: finalRole, is_active: true }, { onConflict: 'user_id,role' });

                const tempEmail = `${phone.replace(/\+/g, '')}@temp.anaqti.sa`;
                // Try to set email and generate magic link
                try {
                  await supabase.auth.admin.updateUserById(userId, { email: tempEmail, email_confirm: true });
                } catch (e) {
                  console.warn('Unable to update user email in fallback:', e);
                }
                const { data: linkData2, error: linkError2 } = await supabase.auth.admin.generateLink({
                  type: 'magiclink',
                  email: tempEmail,
                });
                if (!linkError2 && linkData2?.properties?.hashed_token) {
                  session = { email: tempEmail, token: linkData2.properties.hashed_token, email_otp: linkData2.properties.email_otp };
                } else {
                  console.error('Failed to generate session token (profile fallback):', linkError2);
                }
              } else {
                // لم نعثر على مستخدم Auth رغم وجود phone_exists -> إنشاء مستخدم جديد بالبريد فقط كحل أخير
                console.warn('Fallback: creating email-only user since phone_exists and no auth user found');
                const fallbackEmail = `${phone.replace(/\+/g, '')}@temp.anaqti.sa`;
                const fallbackPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
                const { data: createdAuth, error: createErr } = await supabase.auth.admin.createUser({
                  email: fallbackEmail,
                  password: fallbackPassword,
                  email_confirm: true,
                  user_metadata: { phone, role: finalRole }
                });
                if (createErr || !createdAuth?.user) {
                  console.error('Fallback create user failed:', createErr);
                  return new Response(
                    JSON.stringify({ success: false, error: 'فشل إنشاء المستخدم الاحتياطي' }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                  );
                }
                userId = createdAuth.user.id;

                // إنشاء/تحديث profile وربطه
                if (existingProfile && !existingProfile.auth_user_id) {
                  const updateData: any = { auth_user_id: userId };
                  if (referrerProfileId) {
                    updateData.referred_by = referrerProfileId;
                  }
                  await supabase.from('profiles').update(updateData).eq('id', existingProfile.id);
                  profileId = existingProfile.id;
                } else if (!existingProfile) {
                  const profileData: any = { auth_user_id: userId, phone, full_name: phone, role: finalRole, is_active: true, points: 0 };
                  if (referrerProfileId) {
                    profileData.referred_by = referrerProfileId;
                  }
                  const { data: createdProfile, error: profErr } = await supabase
                    .from('profiles')
                    .insert(profileData)
                    .select()
                    .single();
                  if (profErr) {
                    console.error('Fallback profile create failed:', profErr);
                  }
                  profileId = createdProfile?.id ?? null;
                } else {
                  profileId = existingProfile.id;
                  if (referrerProfileId) {
                    const updateData: any = { referred_by: referrerProfileId };
                    // تحديث الدور إلى affiliate إذا كان هناك referral_code
                    if (referral_code) {
                      updateData.role = finalRole;
                    }
                    await supabase
                      .from('profiles')
                      .update(updateData)
                      .eq('id', profileId)
                      .is('referred_by', null);
                  }
                }

                // إضافة الدور (باستخدام userId)
                await supabase
                  .from('user_roles')
                  .upsert({ user_id: userId, role: finalRole, is_active: true }, { onConflict: 'user_id,role' });

                // توليد magic link
                const { data: linkData2, error: linkError2 } = await supabase.auth.admin.generateLink({
                  type: 'magiclink',
                  email: fallbackEmail,
                });
                if (!linkError2 && (linkData2?.properties?.hashed_token || linkData2?.properties?.email_otp)) {
                  session = {
                    email: fallbackEmail,
                    token: linkData2.properties.hashed_token,
                    email_otp: linkData2.properties.email_otp
                  };
                } else {
                  console.error('Failed to generate session token in fallback:', linkError2);
                  return new Response(
                    JSON.stringify({ success: false, error: 'فشل إنشاء الجلسة' }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                  );
                }
              }
            }
          } else {
            console.error('User creation error:', authError);
            return new Response(
              JSON.stringify({ success: false, error: 'فشل في إنشاء الحساب: ' + (authError?.message || 'خطأ غير معروف') }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else {
          userId = authData.user.id;
          console.log('New user created:', userId);
        }
      }

      if (userId) {
        // الحصول على profile الذي ربما تم إنشاؤه تلقائياً عبر التريجر
        const { data: existingByAuth } = await supabase
          .from('profiles')
          .select('id, phone, role')
          .eq('auth_user_id', userId)
          .maybeSingle();

        if (existingByAuth?.id) {
          profileId = existingByAuth.id;
          // تحديث البيانات الأساسية لضمان الاتساق
          const updateData: any = { phone, full_name: phone, role: finalRole, is_active: true, updated_at: new Date().toISOString() };
          if (referrerProfileId) {
            updateData.referred_by = referrerProfileId;
          }
          await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', profileId);
        } else {
          // إنشاء profile فقط إذا لم يكن موجوداً
          const profileData: any = {
            auth_user_id: userId,
            phone: phone,
            full_name: phone,
            role: finalRole,
            is_active: true,
            points: 0
          };
          if (referrerProfileId) {
            profileData.referred_by = referrerProfileId;
          }
          const { data: newProfile, error: profileError } = await supabase
            .from('profiles')
            .insert(profileData)
            .select()
            .single();

          if (profileError) {
            console.error('Profile creation error:', profileError);
            return new Response(
              JSON.stringify({ success: false, error: 'فشل في إنشاء الملف الشخصي' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          profileId = newProfile.id;
        }

        // إضافة/تحديث الدور في جدول user_roles - استخدام userId (auth_user_id)
        await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: finalRole, is_active: true }, { onConflict: 'user_id,role' });

        // إنشاء session token للمستخدم الجديد
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: tempEmail,
        });

        if (!linkError && (linkData?.properties?.hashed_token || linkData?.properties?.email_otp)) {
          session = {
            email: tempEmail,
            token: linkData.properties.hashed_token,
            email_otp: linkData.properties.email_otp
          };
        } else {
          console.error('Failed to generate session token for new user:', linkError);
        }
      }
    }

    // Ensure session exists
    if (!session || (!session.token && !session.email_otp)) {
      console.error('No session generated after OTP verification');
      return new Response(
        JSON.stringify({ success: false, error: 'فشل إنشاء الجلسة' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // تحديث OTP كمُحقق
    await supabase
      .from('whatsapp_otp')
      .update({
        verified: true,
        ...(userId ? { user_id: userId } : {})
      })
      .eq('id', otpRecord.id);

    console.log('OTP marked as verified');

    return new Response(
      JSON.stringify({
        success: true,
        session: session,
        user: {
          id: userId || null,
          phone: phone,
          role: finalRole,
          profileId: profileId || null
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-platform-otp:', error);
    const corsHeaders = getCorsHeaders(req);
    const errorMessage = error instanceof Error ? error.message : 'خطأ في الخادم';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
