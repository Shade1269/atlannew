import React, { createContext, useContext, useEffect, useState } from "react";

interface LanguageContextType {
  language: "ar" | "en";
  direction: "rtl" | "ltr";
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

// Comprehensive translations object
const translations = {
  ar: {
    // Navigation
    home: "الرئيسية",
    chat: "المحادثة",
    store: "المتجر",
    inventory: "المخزون",
    admin: "الإدارة",
    // Common
    language: "اللغة",
    darkMode: "الوضع المظلم",
    lightMode: "الوضع المضيء",
    arabic: "العربية",
    english: "الإنجليزية",
    toggleLanguage: "تبديل اللغة",
    toggleDarkMode: "تبديل الوضع",
    openMenu: "فتح القائمة",
    closeMenu: "إغلاق القائمة",
    // Auth
    login: "تسجيل الدخول",
    register: "التسجيل",
    signOut: "تسجيل الخروج",
    signIn: "دخول",
    // User Types
    merchant: "تاجر",
    marketer: "مسوق",
    affiliate: "مسوق",
    myStore: "متجري",
    addProducts: "أضف منتجاتك",
    registerAsMerchant: "سجل كتاجر",
    registerAsMarketer: "سجل كمسوق",
    // Platform for Everyone
    platformForEveryone: "منصة للجميع",
    integratedPlatform: "منصة متكاملة للتجار والمسوقين",
    joinPlatform: "انضم إلى منصتنا وابدأ رحلتك في عالم التجارة الإلكترونية",
    // Merchant
    merchantTitle: "تاجر",
    merchantDescription:
      "أضف منتجاتك مع البيانات والأوصاف والأسعار ونسبة العمولة",
    merchantFeatures1: "إضافة المنتجات بسهولة",
    merchantFeatures2: "تحديد الأسعار والعمولات",
    merchantFeatures3: "إدارة بيانات المنتجات",
    merchantFeatures4: "متابعة المبيعات",
    // Marketer
    marketerTitle: "مسوق",
    marketerDescription: "أنشئ متجرك الخاص واختر المنتجات من جميع التجار",
    marketerFeatures1: "إنشاء متجر إلكتروني",
    marketerFeatures2: "اختيار المنتجات",
    marketerFeatures3: "التسويق وكسب العمولات",
    marketerFeatures4: "لوحة تحكم متقدمة",
    // How It Works
    howItWorks: "كيف يعمل النظام؟",
    howItWorksDescription: "خطوات بسيطة لبدء رحلتك في عالم التجارة الإلكترونية",
    step1Title: "التجار يضيفون المنتجات",
    step1Description:
      "التجار يضيفون منتجاتهم مع البيانات والأوصاف والأسعار ونسبة العمولة لكل منتج",
    step2Title: "المسوقين ينشئون المتاجر",
    step2Description:
      "المسوقين ينشئون متاجرهم الإلكترونية الخاصة ويختارون المنتجات من التجار",
    step3Title: "المسوقين يسوقون للمنتجات",
    step3Description:
      "المسوقين يضيفون المنتجات إلى متاجرهم ويسوقون لها لجذب العملاء",
    // Registration Modal
    chooseAccountType: "اختر نوع حسابك",
    chooseAccountTypeDescription:
      "اختر نوع الحساب المناسب لك للبدء في رحلتك معنا",
    notAllowed: "غير مسموح",
    merchantsCannotRegisterAsMarketers:
      "التجار لا يمكنهم التسجيل كمسوقين. يرجى استخدام حساب التاجر الخاص بك.",
    marketersCannotRegisterAsMerchants:
      "المسوقين لا يمكنهم التسجيل كتجار. يرجى استخدام حساب المسوق الخاص بك.",
    forMerchants: "للتجار وأصحاب المتاجر",
    forMarketers: "للمسوقين والأفيليت",
    merchantModalFeatures1: "إضافة المنتجات مع البيانات والأوصاف",
    merchantModalFeatures2: "تحديد الأسعار ونسبة العمولة لكل منتج",
    merchantModalFeatures3: "إدارة بيانات المنتجات والصور",
    merchantModalFeatures4: "متابعة مبيعات منتجاتك",
    merchantModalFeatures5: "ربط مع أنظمة الدفع والشحن",
    marketerModalFeatures1: "إنشاء متجرك الإلكتروني الخاص",
    marketerModalFeatures2: "اختيار المنتجات من جميع التجار",
    marketerModalFeatures3: "إضافة المنتجات إلى متجرك",
    marketerModalFeatures4: "التسويق للمنتجات وكسب العمولات",
    marketerModalFeatures5: "لوحة تحكم متقدمة للإحصائيات",
    notAvailable: "غير متاح",
    chooseMerchant: "اختر تاجر",
    chooseMarketer: "اختر مسوق",
    cancel: "إلغاء",
    // Profile
    profile: "الملف الشخصي",
    settings: "الإعدادات",
    notifications: "الإشعارات",
    help: "المساعدة",
    dashboard: "لوحة التحكم",
    welcome: "مرحباً",
    guest: "ضيف",
    merchantRole: "تاجر",
    affiliateRole: "مسوق",
    adminRole: "مدير",
    userRole: "مستخدم",
    visitor: "زائر",
    adminSystem: "مدير النظام",
    // Platform Name
    platformName: "منصة أتلانتس",
    integratedEcommercePlatform: "منصة متكاملة للتجارة الإلكترونية",
    platformDescription: "منصة متكاملة تجمع التجار والمسوقين والعملاء",
    platformFullDescription:
      "نظام متكامل للتجارة الإلكترونية حيث يضيف التجار منتجاتهم، والمسوقين ينشئون متاجرهم الخاصة ويسوقون للمنتجات، والعملاء يتسوقون بسهولة وأمان",
    // Footer
    quickLinks: "روابط سريعة",
    stores: "المتاجر",
    leaderboard: "المتصدرون",
    ourServices: "خدماتنا",
    freeShippingOver200: "شحن مجاني للطلبات فوق 200 ريال",
    qualityGuarantee: "ضمان الجودة والأمان",
    securePayment: "دفع آمن ومتعدد الطرق",
    support24h: "دعم فني على مدار الساعة",
    contactUs: "تواصل معنا",
    allRightsReserved: "جميع الحقوق محفوظة",
    privacyPolicy: "سياسة الخصوصية",
    termsOfService: "شروط الاستخدام",
    returnPolicy: "سياسة الاسترجاع",
    madeWithLove: "صنع بـ",
    inSaudiArabia: "في السعودية",
    // Hero
    startNow: "ابدأ الآن",
    product: "منتج",
    products: "منتجات",
    user: "مستخدم",
    users: "مستخدمين",
    customerSatisfaction: "رضا العملاء",
    // Auth Card
    joinAnaqatiPlatform: "انضم إلى منصة أتلانتس",
    registerNewAccount: "سجل حساب جديد واستمتع بتجربة تسوق مميزة",
    startShoppingJourney: "بدء رحلة التسوق",
    tryDemoStore: "جرب المتجر التجريبي",
    secureShopping: "تسوق آمن",
    freeShipping: "شحن مجاني",
    // Common
    currentLanguage: "اللغة الحالية",
    availableLanguages: "اللغات المتاحة",
    selectLanguage: "اختر اللغة",
    // Features Section
    platformFeatures: "مميزات المنصة",
    platformFeaturesDescription:
      "منصة متكاملة تجمع كل ما تحتاجه لإدارة متجرك الإلكتروني بنجاح",
    feature1Title: "إدارة المنتجات للتجار",
    feature1Description:
      "التجار يضيفون منتجاتهم مع جميع البيانات والأوصاف والأسعار ونسبة العمولة",
    feature2Title: "متاجر المسوقين",
    feature2Description:
      "المسوقين ينشئون متاجرهم الخاصة ويختارون المنتجات من جميع التجار",
    feature3Title: "أمان عالي",
    feature3Description:
      "حماية متقدمة لبياناتك ومعاملاتك مع تشفير من الدرجة الأولى",
    feature4Title: "أداء سريع",
    feature4Description: "منصة سريعة وموثوقة مع دعم للعملاء على مدار الساعة",
    // Benefits Section
    whyChooseUs: "لماذا تختارنا؟",
    whyChooseUsDescription: "مميزات تجعلنا الخيار الأفضل لأعمالك التجارية",
    benefit1Title: "أمان عالي",
    benefit1Description: "حماية متقدمة لبياناتك ومعاملاتك",
    benefit2Title: "أداء سريع",
    benefit2Description: "منصة سريعة وموثوقة",
    benefit3Title: "متعدد اللغات",
    benefit3Description: "دعم للغة العربية والإنجليزية",
    benefit4Title: "دفع آمن",
    benefit4Description: "طرق دفع متعددة وآمنة",
    benefit5Title: "شحن سريع",
    benefit5Description: "شحن مجاني للطلبات الكبيرة",
    benefit6Title: "دعم فني",
    benefit6Description: "دعم على مدار الساعة",
    // CTA Section
    readyToStart: "جاهز للبدء؟",
    joinThousands: "انضم إلى آلاف التجار والمسوقين والعملاء الذين يثقون بنا",
    createFreeAccount: "إنشاء حساب مجاني",
  },
  en: {
    // Navigation  
    home: "Home",
    chat: "Chat",
    store: "Store",
    inventory: "Inventory",
    admin: "Admin",
    // Common
    language: "Language",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    arabic: "Arabic",
    english: "English",
    toggleLanguage: "Toggle Language",
    toggleDarkMode: "Toggle Dark Mode",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    // Auth
    login: "Sign In",
    register: "Register",
    signOut: "Sign Out",
    signIn: "Sign In",
    // User Types
    merchant: "Merchant",
    marketer: "Marketer",
    affiliate: "Affiliate",
    myStore: "My Store",
    addProducts: "Add Your Products",
    registerAsMerchant: "Register as Merchant",
    registerAsMarketer: "Register as Marketer",
    // Platform for Everyone
    platformForEveryone: "Platform for Everyone",
    integratedPlatform: "Integrated Platform for Merchants and Marketers",
    joinPlatform: "Join our platform and start your journey in e-commerce",
    // Merchant
    merchantTitle: "Merchant",
    merchantDescription:
      "Add your products with data, descriptions, prices and commission rate",
    merchantFeatures1: "Easy product addition",
    merchantFeatures2: "Set prices and commissions",
    merchantFeatures3: "Manage product data",
    merchantFeatures4: "Track sales",
    // Marketer
    marketerTitle: "Marketer",
    marketerDescription:
      "Create your own store and choose products from all merchants",
    marketerFeatures1: "Create online store",
    marketerFeatures2: "Choose products",
    marketerFeatures3: "Marketing and earn commissions",
    marketerFeatures4: "Advanced dashboard",
    // How It Works
    howItWorks: "How It Works?",
    howItWorksDescription: "Simple steps to start your journey in e-commerce",
    step1Title: "Merchants Add Products",
    step1Description:
      "Merchants add their products with data, descriptions, prices and commission rate for each product",
    step2Title: "Marketers Create Stores",
    step2Description:
      "Marketers create their own online stores and choose products from merchants",
    step3Title: "Marketers Market Products",
    step3Description:
      "Marketers add products to their stores and market them to attract customers",
    // Registration Modal
    chooseAccountType: "Choose Your Account Type",
    chooseAccountTypeDescription:
      "Choose the appropriate account type for you to start your journey with us",
    notAllowed: "Not Allowed",
    merchantsCannotRegisterAsMarketers:
      "Merchants cannot register as marketers. Please use your merchant account.",
    marketersCannotRegisterAsMerchants:
      "Marketers cannot register as merchants. Please use your marketer account.",
    forMerchants: "For Merchants and Store Owners",
    forMarketers: "For Marketers and Affiliates",
    merchantModalFeatures1: "Add products with data and descriptions",
    merchantModalFeatures2: "Set prices and commission rate for each product",
    merchantModalFeatures3: "Manage product data and images",
    merchantModalFeatures4: "Track your product sales",
    merchantModalFeatures5: "Connect with payment and shipping systems",
    marketerModalFeatures1: "Create your own online store",
    marketerModalFeatures2: "Choose products from all merchants",
    marketerModalFeatures3: "Add products to your store",
    marketerModalFeatures4: "Market products and earn commissions",
    marketerModalFeatures5: "Advanced dashboard for statistics",
    notAvailable: "Not Available",
    chooseMerchant: "Choose Merchant",
    chooseMarketer: "Choose Marketer",
    cancel: "Cancel",
    // Profile
    profile: "Profile",
    settings: "Settings",
    notifications: "Notifications",
    help: "Help",
    dashboard: "Dashboard",
    welcome: "Welcome",
    guest: "Guest",
    merchantRole: "Merchant",
    affiliateRole: "Affiliate",
    adminRole: "Admin",
    userRole: "User",
    visitor: "Visitor",
    adminSystem: "System Admin",
    // Platform Name
    platformName: "Anaqati Platform",
    integratedEcommercePlatform: "Integrated E-commerce Platform",
    platformDescription:
      "Integrated platform that brings together merchants, marketers and customers",
    platformFullDescription:
      "Integrated e-commerce system where merchants add their products, marketers create their own stores and market products, and customers shop easily and securely",
    // Footer
    quickLinks: "Quick Links",
    stores: "Stores",
    leaderboard: "Leaderboard",
    ourServices: "Our Services",
    freeShippingOver200: "Free shipping for orders over 200 SAR",
    qualityGuarantee: "Quality and Security Guarantee",
    securePayment: "Secure and Multiple Payment Methods",
    support24h: "24/7 Technical Support",
    contactUs: "Contact Us",
    allRightsReserved: "All rights reserved",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    returnPolicy: "Return Policy",
    madeWithLove: "Made with",
    inSaudiArabia: "in Saudi Arabia",
    // Hero
    startNow: "Start Now",
    product: "Product",
    products: "Products",
    user: "User",
    users: "Users",
    customerSatisfaction: "Customer Satisfaction",
    // Auth Card
    joinAnaqatiPlatform: "Join Anaqati Platform",
    registerNewAccount:
      "Register a new account and enjoy a unique shopping experience",
    startShoppingJourney: "Start Shopping Journey",
    tryDemoStore: "Try Demo Store",
    secureShopping: "Secure Shopping",
    freeShipping: "Free Shipping",
    // Common
    currentLanguage: "Current Language",
    availableLanguages: "Available Languages",
    selectLanguage: "Select Language",
    // Features Section
    platformFeatures: "Platform Features",
    platformFeaturesDescription:
      "An integrated platform that brings together everything you need to successfully manage your online store",
    feature1Title: "Product Management for Merchants",
    feature1Description:
      "Merchants add their products with all data, descriptions, prices, and commission rates",
    feature2Title: "Marketers' Stores",
    feature2Description:
      "Marketers create their own stores and choose products from all merchants",
    feature3Title: "High Security",
    feature3Description:
      "Advanced protection for your data and transactions with first-class encryption",
    feature4Title: "Fast Performance",
    feature4Description:
      "A fast and reliable platform with 24/7 customer support",
    // Benefits Section
    whyChooseUs: "Why Choose Us?",
    whyChooseUsDescription:
      "Features that make us the best choice for your business",
    benefit1Title: "High Security",
    benefit1Description: "Advanced protection for your data and transactions",
    benefit2Title: "Fast Performance",
    benefit2Description: "Fast and reliable platform",
    benefit3Title: "Multi-language",
    benefit3Description: "Support for Arabic and English languages",
    benefit4Title: "Secure Payment",
    benefit4Description: "Multiple and secure payment methods",
    benefit5Title: "Fast Shipping",
    benefit5Description: "Free shipping for large orders",
    benefit6Title: "Technical Support",
    benefit6Description: "24/7 support",
    // CTA Section
    readyToStart: "Ready to Start?",
    joinThousands:
      "Join thousands of merchants, marketers, and customers who trust us",
    createFreeAccount: "Create Free Account",
  },
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const [language, setLanguage] = useState<"ar" | "en">("ar");

  // Initialize language from localStorage or default to Arabic
  useEffect(() => {
    try {
      const stored = (
        typeof window !== "undefined"
          ? window.localStorage?.getItem("language")
          : null
      ) as "ar" | "en" | null;
      const defaultLang = stored === "ar" || stored === "en" ? stored : "ar";
      setLanguage(defaultLang);
      updateDocumentDirection(defaultLang);
    } catch (e) {
      // Safari (especially Private mode) may block localStorage access
      setLanguage("ar");
      updateDocumentDirection("ar");
    }
  }, []);

  const updateDocumentDirection = (lang: "ar" | "en") => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  const toggleLanguage = () => {
    const newLang = language === "ar" ? "en" : "ar";
    setLanguage(newLang);
    try {
      if (typeof window !== "undefined") {
        window.localStorage?.setItem("language", newLang);
      }
    } catch {
      // ignore storage errors (Safari private mode)
    }
    updateDocumentDirection(newLang);
  };

  const t = (key: string): string => {
    return (
      translations[language][key as keyof (typeof translations)["ar"]] || key
    );
  };

  const value: LanguageContextType = {
    language,
    direction: (language === "ar" ? "rtl" : "ltr") as "rtl" | "ltr",
    toggleLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
