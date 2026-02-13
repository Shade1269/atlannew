import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useFastAuth } from "@/hooks/useFastAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Store,
  TrendingUp,
  Loader2,
  ArrowRight,
  LogIn,
  UserPlus,
  FileText,
  Phone,
  MapPin,
  Mail,
  Lock,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STORAGE_BUCKET = "commercial-registry";

type AuthMode = "login" | "signup";
type RoleType = "merchant" | "affiliate" | null;

const PlatformAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user, profile, loading: authLoading, signIn, signUp } = useFastAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<AuthMode>("login");
  const [selectedRole, setSelectedRole] = useState<RoleType>(null);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Signup form (common)
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupSubmitting, setSignupSubmitting] = useState(false);

  // Merchant-only
  const [merchantPhone, setMerchantPhone] = useState("");
  const [merchantAddress, setMerchantAddress] = useState("");
  const [merchantFile, setMerchantFile] = useState<File | null>(null);
  const [merchantFileError, setMerchantFileError] = useState("");

  const typeParam = searchParams.get("type");
  const stateRole = (location.state as { registrationType?: "merchant" | "marketer" })?.registrationType;

  useEffect(() => {
    if (typeParam === "merchant" || stateRole === "merchant") {
      setMode("signup");
      setSelectedRole("merchant");
    } else if (typeParam === "marketer" || typeParam === "affiliate" || stateRole === "marketer") {
      setMode("signup");
      setSelectedRole("affiliate");
    }
  }, [typeParam, stateRole]);

  useEffect(() => {
    if (authLoading) return;
    if (user && profile) {
      if (profile.role === "admin") navigate("/admin/dashboard", { replace: true });
      else if (profile.role === "affiliate") navigate("/affiliate", { replace: true });
      else if (profile.role === "merchant") navigate("/merchant", { replace: true });
      else navigate("/", { replace: true });
    }
  }, [user, profile, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) return;
    setLoginSubmitting(true);
    try {
      const { error } = await signIn(loginEmail.trim(), loginPassword);
      if (!error) navigate("/");
    } finally {
      setLoginSubmitting(false);
    }
  };

  const uploadCommercialRegistry = async (userId: string, file: File): Promise<string | null> => {
    const ext = file.name.slice(file.name.lastIndexOf(".")) || ".pdf";
    const path = `${userId}/${Date.now()}${ext}`;
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      console.error("Upload error:", error);
      toast({
        title: "خطأ في رفع الملف",
        description: error.message || "تأكد من وجود bucket باسم commercial-registry في Supabase.",
        variant: "destructive",
      });
      return null;
    }
    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);
    return urlData?.publicUrl ?? null;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    if (selectedRole === "merchant") {
      if (!merchantPhone.trim() || !merchantAddress.trim()) {
        toast({
          title: "بيانات ناقصة",
          description: "يرجى إدخال رقم التليفون والعنوان.",
          variant: "destructive",
        });
        return;
      }
      if (!merchantFile || merchantFile.type !== "application/pdf") {
        setMerchantFileError("يرجى رفع صورة السجل التجاري بصيغة PDF.");
        toast({
          title: "ملف مطلوب",
          description: "يرجى رفع صورة السجل التجاري (PDF).",
          variant: "destructive",
        });
        return;
      }
    }

    if (!signupEmail.trim() || !signupPassword.trim() || !signupFullName.trim()) return;
    setMerchantFileError("");

    setSignupSubmitting(true);
    try {
      // للتاجر: ننشئ الحساب أولاً ثم نرفع الملف بربطه بـ userId
      const { data: signUpData, error } = await signUp({
        email: signupEmail.trim().toLowerCase(),
        password: signupPassword,
        fullName: signupFullName.trim(),
        username: signupUsername.trim() || signupFullName.trim(),
        role: selectedRole === "merchant" ? "merchant" : "affiliate",
        ...(selectedRole === "merchant" && {
          merchantData: {
            phone: merchantPhone.trim(),
            address: merchantAddress.trim(),
            commercial_registry_url: "", // يُحدَّث بعد رفع الملف إن وُجد userId
          },
        }),
      });

      if (error) {
        setSignupSubmitting(false);
        return;
      }

      // بعد إنشاء الحساب: رفع ملف السجل التجاري إذا وُجد المستخدم
      if (selectedRole === "merchant" && merchantFile && signUpData?.user?.id) {
        const url = await uploadCommercialRegistry(signUpData.user.id, merchantFile);
        if (url) {
          await supabase.auth.updateUser({
            data: {
              commercial_registry_url: url,
              phone: merchantPhone.trim(),
              address: merchantAddress.trim(),
            },
          });
        }
      }

      if (!error) navigate("/");
    } finally {
      setSignupSubmitting(false);
    }
  };

  const onMerchantFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      setMerchantFile(null);
      setMerchantFileError("");
      return;
    }
    if (f.type !== "application/pdf") {
      setMerchantFile(null);
      setMerchantFileError("يرجى اختيار ملف PDF فقط.");
      return;
    }
    setMerchantFileError("");
    setMerchantFile(f);
  };

  if (authLoading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري تحميل حسابك...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-slate-50 via-white to-primary/5 dark:from-slate-950 dark:via-slate-900 dark:to-primary/10">
      {/* Left: Branding */}
      <div className="w-full md:w-[44%] flex flex-col justify-center p-8 md:p-12 lg:p-16">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </button>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
          {t("platformName")}
        </h1>
        <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
          {t("integratedEcommercePlatform")}
        </p>
        <p className="text-muted-foreground mt-6 max-w-md leading-relaxed">
          سجّل دخولك كتاجر أو مسوق، أو أنشئ حساباً جديداً وابدأ رحلتك معنا.
        </p>
      </div>

      {/* Right: Auth form */}
      <div className="w-full md:w-[56%] flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md shadow-xl border-0 md:border bg-card/95 backdrop-blur">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center font-semibold">الحساب</CardTitle>
            <CardDescription className="text-center">
              تسجيل الدخول أو إنشاء حساب تاجر / مسوق
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={mode}
              onValueChange={(v) => {
                setMode(v as AuthMode);
                setSelectedRole(null);
                setMerchantFile(null);
                setMerchantFileError("");
              }}
            >
              <TabsList className="grid w-full grid-cols-2 mb-6 h-11 bg-muted/60">
                <TabsTrigger
                  value="login"
                  className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-700 data-[state=active]:dark:text-white"
                >
                  <LogIn className="w-4 h-4 shrink-0" />
                  تسجيل الدخول
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold data-[state=active]:shadow-sm data-[state=active]:dark:bg-slate-700 data-[state=active]:dark:text-white"
                >
                  <UserPlus className="w-4 h-4 shrink-0" />
                  إنشاء حساب
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      البريد الإلكتروني
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="example@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      كلمة المرور
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="h-11"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 font-semibold text-primary-foreground dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                    disabled={loginSubmitting}
                  >
                    {loginSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin text-inherit" />
                    ) : (
                      "تسجيل الدخول"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                {selectedRole === null ? (
                  <div className="space-y-6">
                    <p className="text-sm text-muted-foreground text-center">
                      اختر نوع الحساب الذي تريد إنشاءه
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setSelectedRole("merchant")}
                        className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-right"
                      >
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Store className="w-7 h-7 text-primary" />
                        </div>
                        <span className="font-semibold">{t("merchantTitle")}</span>
                        <span className="text-xs text-muted-foreground">{t("forMerchants")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole("affiliate")}
                        className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-right"
                      >
                        <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center">
                          <TrendingUp className="w-7 h-7 text-secondary" />
                        </div>
                        <span className="font-semibold">{t("marketerTitle")}</span>
                        <span className="text-xs text-muted-foreground">{t("forMarketers")}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 mb-4">
                      {selectedRole === "merchant" ? (
                        <Store className="w-5 h-5 text-primary" />
                      ) : (
                        <TrendingUp className="w-5 h-5 text-secondary" />
                      )}
                      <span className="font-medium">
                        {selectedRole === "merchant" ? t("merchantTitle") : t("marketerTitle")}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRole(null);
                          setMerchantFile(null);
                          setMerchantFileError("");
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground mr-auto"
                      >
                        تغيير
                      </button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        الاسم الكامل
                      </Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="أحمد محمد"
                        value={signupFullName}
                        onChange={(e) => setSignupFullName(e.target.value)}
                        required
                        autoComplete="name"
                        className="h-11"
                      />
                    </div>

                    {selectedRole === "merchant" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="merchant-phone" className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            رقم التليفون
                          </Label>
                          <Input
                            id="merchant-phone"
                            type="tel"
                            placeholder="05xxxxxxxx"
                            value={merchantPhone}
                            onChange={(e) => setMerchantPhone(e.target.value)}
                            required
                            autoComplete="tel"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="merchant-address" className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            العنوان
                          </Label>
                          <Input
                            id="merchant-address"
                            type="text"
                            placeholder="المدينة، الحي، الشارع"
                            value={merchantAddress}
                            onChange={(e) => setMerchantAddress(e.target.value)}
                            required
                            autoComplete="street-address"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="merchant-commercial-registry" className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            صورة السجل التجاري (PDF)
                          </Label>
                          <input
                            id="merchant-commercial-registry"
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={onMerchantFileChange}
                            className="hidden"
                            title="صورة السجل التجاري PDF"
                            aria-label="صورة السجل التجاري PDF"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11 border-dashed"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {merchantFile ? merchantFile.name : "اختر ملف PDF"}
                          </Button>
                          {merchantFileError && (
                            <p className="text-sm text-destructive">{merchantFileError}</p>
                          )}
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        البريد الإلكتروني
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="example@email.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="h-11"
                      />
                    </div>
                    {selectedRole === "affiliate" && (
                      <div className="space-y-2">
                        <Label htmlFor="signup-username">اسم المستخدم (اختياري)</Label>
                        <Input
                          id="signup-username"
                          type="text"
                          placeholder="username"
                          value={signupUsername}
                          onChange={(e) => setSignupUsername(e.target.value)}
                          autoComplete="username"
                          className="h-11"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        كلمة المرور (6 أحرف على الأقل)
                      </Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        className="h-11"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-11 font-semibold text-primary-foreground dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                      disabled={signupSubmitting}
                    >
                      {signupSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin text-inherit" />
                      ) : (
                        "إنشاء الحساب"
                      )}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlatformAuthPage;
