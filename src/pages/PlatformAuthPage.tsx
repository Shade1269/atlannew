import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useFastAuth } from "@/hooks/useFastAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Store, TrendingUp, Loader2, ArrowRight, LogIn, UserPlus } from "lucide-react";
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

type AuthMode = "login" | "signup";
type RoleType = "merchant" | "affiliate" | null;

const PlatformAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user, profile, loading: authLoading, signIn, signUp } = useFastAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<AuthMode>("login");
  const [selectedRole, setSelectedRole] = useState<RoleType>(null);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Signup form
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupSubmitting, setSignupSubmitting] = useState(false);

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !signupEmail.trim() || !signupPassword.trim() || !signupFullName.trim()) return;
    setSignupSubmitting(true);
    try {
      const { error } = await signUp({
        email: signupEmail.trim().toLowerCase(),
        password: signupPassword,
        fullName: signupFullName.trim(),
        username: signupUsername.trim() || signupFullName.trim(),
        role: selectedRole === "merchant" ? "merchant" : "affiliate",
      });
      if (!error) navigate("/");
    } finally {
      setSignupSubmitting(false);
    }
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
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left: Branding */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex flex-col justify-center p-8 md:p-12">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </button>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          {t("platformName")}
        </h1>
        <p className="text-muted-foreground text-lg max-w-md">
          {t("integratedEcommercePlatform")}
        </p>
        <p className="text-muted-foreground mt-4 max-w-md">
          سجّل دخولك كتاجر أو مسوق، أو أنشئ حساباً جديداً وابدأ رحلتك معنا.
        </p>
      </div>

      {/* Right: Auth form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">الحساب</CardTitle>
            <CardDescription className="text-center">
              تسجيل الدخول أو إنشاء حساب تاجر / مسوق
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(v) => { setMode(v as AuthMode); setSelectedRole(null); }}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  تسجيل الدخول
                </TabsTrigger>
                <TabsTrigger value="signup" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  إنشاء حساب
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">البريد الإلكتروني</Label>
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
                    <Label htmlFor="login-password">كلمة المرور</Label>
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
                  <Button type="submit" className="w-full h-11" disabled={loginSubmitting}>
                    {loginSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "تسجيل الدخول"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                {selectedRole === null ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center mb-4">
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
                        onClick={() => setSelectedRole(null)}
                        className="text-xs text-muted-foreground hover:text-foreground mr-auto"
                      >
                        تغيير
                      </button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">الاسم الكامل</Label>
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
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">البريد الإلكتروني</Label>
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
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">كلمة المرور (6 أحرف على الأقل)</Label>
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
                    <Button type="submit" className="w-full h-11" disabled={signupSubmitting}>
                      {signupSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
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
