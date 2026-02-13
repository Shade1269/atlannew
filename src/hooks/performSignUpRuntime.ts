export const performSignUpRuntime = async (
  { supabase, toast, fetchUserProfile, getBaseUrlFn }: any,
  { email, password, fullName, username, role, merchantData }: any
): Promise<{ data?: any; error: any }> => {
  const fallbackGetBaseUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "https://sawal-shamel.lovable.app";
  };

  const resolveBaseUrl =
    typeof getBaseUrlFn === "function" ? getBaseUrlFn : fallbackGetBaseUrl;

  try {
    const normalizedRole = role ?? "affiliate";
    const normalizedUsername = (username || fullName || "").trim() || fullName;

    // Extract referral code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get("ref");
    let referrerProfileId = null;

    if (referralCode) {
      // Use SECURITY DEFINER function to bypass RLS for referral code lookup
      console.log(`[SignUp] Looking up referral code: ${referralCode}`);
      const { data: referrerId, error: referrerError } = await supabase.rpc(
        "get_referrer_by_code",
        { p_referral_code: referralCode }
      );

      console.log(`[SignUp] RPC result - data:`, referrerId, `error:`, referrerError);

      if (referrerError) {
        console.error(
          "[SignUp] Error fetching referrer profile:",
          referrerError
        );
      } else if (referrerId) {
        referrerProfileId = referrerId;
        console.log(`[SignUp] User referred by: ${referrerProfileId}`);
      } else {
        console.warn(`[SignUp] Referral code "${referralCode}" not found (returned null).`);
      }
    }

    const { data: existingUser } = await supabase
      .from("user_profiles")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      const errorMsg =
        "هذا البريد الإلكتروني مستخدم مسبقاً. الرجاء استخدام بريد آخر أو تسجيل الدخول.";
      toast({
        title: "خطأ في التسجيل",
        description: errorMsg,
        variant: "destructive",
      });
      return { error: new Error("Email already exists") };
    }

    const redirectUrl = `${resolveBaseUrl()}/`;

    const signUpMetadata: Record<string, unknown> = {
      full_name: fullName,
      username: normalizedUsername,
      role: normalizedRole,
    };
    if (merchantData && typeof merchantData === "object") {
      if (merchantData.phone) signUpMetadata.phone = merchantData.phone;
      if (merchantData.address) signUpMetadata.address = merchantData.address;
      if (merchantData.commercial_registry_url) signUpMetadata.commercial_registry_url = merchantData.commercial_registry_url;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: signUpMetadata,
      },
    });

    if (error) {
      let errorMessage = error.message;

      if (
        error.message.includes("already registered") ||
        error.message.includes("User already registered")
      ) {
        errorMessage =
          "هذا البريد الإلكتروني مستخدم مسبقاً. الرجاء استخدام بريد آخر أو تسجيل الدخول.";
      } else if (error.message.includes("Password should be at least")) {
        errorMessage = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
      } else if (error.message.includes("Invalid email")) {
        errorMessage = "البريد الإلكتروني غير صحيح";
      } else if (error.message.includes("weak password")) {
        errorMessage = "كلمة المرور ضعيفة. استخدم أحرف وأرقام ورموز";
      } else if (error.message.includes("signup disabled")) {
        errorMessage = "التسجيل معطل حالياً. تواصل مع الدعم الفني";
      }

      toast({
        title: "خطأ في التسجيل",
        description: errorMessage,
        variant: "destructive",
      });

      return { error };
    }

    if (data?.user) {
      // Insert into profiles table using SECURITY DEFINER function to bypass RLS
      // This ensures referred_by is set correctly even if profile was created by trigger
      const { data: profileData, error: profileError } = await supabase.rpc(
        "create_or_update_profile",
        {
          p_auth_user_id: data.user.id,
          p_email: email,
          p_full_name: fullName,
          p_role: normalizedRole,
          p_referred_by: referrerProfileId,
        }
      );

      if (profileError) {
        console.error("Error creating profile record:", profileError);
        toast({
          title: "تحذير",
          description:
            "تم إنشاء الحساب ولكن حدث خطأ في حفظ بيانات الملف الشخصي.",
          variant: "destructive",
        });
      }

      // حفظ رقم الهاتف والعنوان للتاجر في profiles إن وُجدت
      if (merchantData && (merchantData.phone || merchantData.address)) {
        const { error: updateErr } = await supabase
          .from("profiles")
          .update({
            ...(merchantData.phone && { phone: merchantData.phone }),
            // إن كان الجدول يدعم حقل العنوان يمكن إضافته لاحقاً
          })
          .eq("auth_user_id", data.user.id);
        if (updateErr) {
          console.warn("Error updating profile phone/address:", updateErr);
        }
      }

      await fetchUserProfile(data.user.id, false);
    }

    if (data?.user && !data.user.email_confirmed_at) {
      toast({
        title: "تم التسجيل بنجاح!",
        description: "تم إنشاء حسابك بنجاح. يمكنك الآن تسجيل الدخول.",
      });
    } else {
      toast({
        title: "تم التسجيل بنجاح!",
        description: "مرحباً بك! تم إنشاء حسابك وتسجيل دخولك تلقائياً.",
      });
    }

    return { data, error: null };
  } catch (error) {
    console.error("SignUp error:", error);

    let errorMessage = "حدث خطأ أثناء إنشاء الحساب";
    if (error?.message?.includes && error.message.includes("network")) {
      errorMessage = "تحقق من اتصال الإنترنت وحاول مرة أخرى";
    }

    toast({
      title: "خطأ في التسجيل",
      description: errorMessage,
      variant: "destructive",
    });

    return { error };
  }
};
