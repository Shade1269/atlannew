import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import {
  Banknote,
  CreditCard,
  ChevronLeft,
  Truck,
  User,
  ShoppingCart,
} from "lucide-react";
import {
  UnifiedButton,
  UnifiedCard,
  UnifiedInput,
  UnifiedBadge,
} from "@/components/design-system";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabasePublic } from "@/integrations/supabase/publicClient";
import { useIsolatedStoreCart } from "@/hooks/useIsolatedStoreCart";
import { GeideaPayment } from "@/components/payment/GeideaPayment";
import { useToast } from "@/hooks/use-toast";
import { useBolesaCities } from "@/hooks/useBolesaCities";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { BolesaCarrier } from "@/hooks/useShipLink";

interface StoreContextType {
  store: {
    id: string;
    store_name: string;
    store_slug: string;
    shop_id?: string;
  };
}


// طرق الدفع المتاحة
const PAYMENT_METHODS = [
  {
    id: "cod",
    title: "الدفع عند الاستلام",
    description: "ادفع نقداً عند استلام طلبك",
    icon: Banknote,
  },
  {
    id: "geidea",
    title: "الدفع الإلكتروني - Geidea",
    description: "ادفع بأمان عبر بطاقة الائتمان أو مدى أو Apple Pay",
    icon: CreditCard,
  },
];

const TAX_RATE = 0.15;

const formatCurrency = (value: number) => {
  const formatted = Math.max(0, Math.round(value)).toLocaleString("en-US");
  return `${formatted} ر.س`;
};

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isDarkMode = document.documentElement.classList.contains('dark');
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const context = useOutletContext<StoreContextType>();
  const store = context?.store;
  
  // حفظ معلومات المتجر من cart
  const [storeInfo, setStoreInfo] = useState<{
    id: string;
    shop_id: string;
    bolesa_vendor_id?: number | null;
  } | null>(null);
  
  // استخدام نفس الـ hook الذي تستخدمه صفحة السلة
  const {
    cart,
    loading: cartLoading,
    clearCart,
  } = useIsolatedStoreCart(store?.id || "", storeSlug);
  
  // تطبيق التصميم المخصص لصفحة الدفع (بدون إزالة النمط الليلي العام)
  useEffect(() => {
    // إضافة data-page="checkout" إلى body (للتطبيق الإجباري للأنماط المخصصة)
    document.body.setAttribute("data-page", "checkout");
    
    return () => {
      document.body.removeAttribute("data-page");
    };
  }, []);
  
  // الحصول على معلومات المتجر من context أو cart
  useEffect(() => {
    // حفظ store slug في localStorage للاستخدام لاحقاً
    if (storeSlug) {
      localStorage.setItem("current_store_slug", storeSlug);
    }
    if (store?.store_slug) {
      localStorage.setItem("current_store_slug", store.store_slug);
    }
    
    const loadStoreInfo = async () => {
      const affiliateStoreId =
        store?.id || localStorage.getItem("storefront:last-store-id");
      
      // أولاً: محاولة جلب affiliate_store مع bolesa_vendor_id
      if (affiliateStoreId) {
        console.log("🔍 Getting store info with bolesa_vendor_id from affiliate_stores:", affiliateStoreId);
        const { data: affiliateStore, error: _storeError } = await supabasePublic
          .from("affiliate_stores")
          .select("id, bolesa_vendor_id")
          .eq("id", affiliateStoreId)
          .maybeSingle();
        
        if (affiliateStore) {
          console.log("✅ Store info from affiliate_stores:", affiliateStore);
          setStoreInfo({
            id: affiliateStore.id,
            shop_id: affiliateStore.id,
            bolesa_vendor_id: affiliateStore.bolesa_vendor_id || null,
          });
          return;
        }
      }
      
      // ثانياً: محاولة من context (إذا كان shop_id موجود فيه)
      if (store?.id && (store as any)?.shop_id) {
        // محاولة جلب bolesa_vendor_id من affiliate_stores
        const { data: affiliateStore, error: _storeError2 } = await supabasePublic
          .from("affiliate_stores")
          .select("bolesa_vendor_id")
          .eq("id", store.id)
          .maybeSingle();
        
        console.log("✅ Store info from context:", {
          id: store.id,
          shop_id: (store as any).shop_id,
          bolesa_vendor_id: affiliateStore?.bolesa_vendor_id || null,
        });
        setStoreInfo({
          id: store.id,
          shop_id: (store as any).shop_id,
          bolesa_vendor_id: affiliateStore?.bolesa_vendor_id || null,
        });
        return;
      }
      
      // ثالثاً: الحصول من cart items - جلب shop_id من المنتج
      if (cart?.items?.[0]) {
        const firstItem = cart.items[0];
        console.log("🔍 Getting shop_id from product:", firstItem.product_id);
        
        const { data: productData, error } = await supabasePublic
          .from("products")
          .select("shop_id")
          .eq("id", firstItem.product_id)
          .maybeSingle();

        console.log("📦 Product data:", productData, "Error:", error);
        
        if (productData?.shop_id && affiliateStoreId) {
          // محاولة جلب bolesa_vendor_id من shops
          const { data: shopData, error: _shopError } = await supabasePublic
            .from("shops")
            .select("bolesa_vendor_id")
            .eq("id", productData.shop_id)
            .maybeSingle();
          
          console.log("✅ Store info from product:", {
            id: affiliateStoreId,
            shop_id: productData.shop_id,
            bolesa_vendor_id: shopData?.bolesa_vendor_id || null,
          });
          setStoreInfo({
            id: affiliateStoreId,
            shop_id: productData.shop_id,
            bolesa_vendor_id: shopData?.bolesa_vendor_id || null,
          });
          return;
        }
      }
      
      // رابعاً: الحصول على أول shop من جدول shops
      console.log("🔍 Getting first available shop from shops table...");
      const { data: firstShop, error: shopError } = await supabasePublic
        .from("shops")
        .select("id, bolesa_vendor_id")
        .limit(1)
        .maybeSingle();
      
      console.log("🏪 First shop result:", firstShop, "Error:", shopError);
      
      if (firstShop?.id && affiliateStoreId) {
        console.log("✅ Using first shop as fallback:", {
          id: affiliateStoreId,
          shop_id: firstShop.id,
          bolesa_vendor_id: firstShop.bolesa_vendor_id || null,
        });
        setStoreInfo({
          id: affiliateStoreId,
          shop_id: firstShop.id,
          bolesa_vendor_id: firstShop.bolesa_vendor_id || null,
        });
        return;
      }
      
      // إذا لم نجد أي shop، نترك storeInfo كـ null
      // وسيتم التعامل معها في handlePlaceOrder
      console.warn("⚠️ Could not find any valid shop_id");
    };
    
    loadStoreInfo();
  }, [store, cart]);

  // معلومات العميل
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    nationalAddressCode: "", // ✅ الرمز الوطني (لتحديد العنوان)
    street: "",
    city: "",
    district: "",
    postalCode: "",
    notes: "",
  });

  // الحالات
  const [_shippingMethod, _setShippingMethod] = useState("standard");
  const [bolesaRate, setBolesaRate] = useState<number | null>(null);
  const [bolesaCarriers, setBolesaCarriers] = useState<BolesaCarrier[]>([]);
  const [selectedCarrierId, setSelectedCarrierId] = useState<
    string | number | null
  >(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  // Bolesa cities hook
  const {
    cities: bolesaCities,
    cityMap: _bolesaCityMap,
    getCityId,
    loading: bolesaCitiesLoading,
  } = useBolesaCities();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false); // Show payment directly in page (no Dialog)
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<"geidea" | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  
  // حالة التحميل لشركات الشحن
  const [bolesaCarriersLoading, setBolesaCarriersLoading] = useState(false);

  // حساب المجاميع
  const subtotal = useMemo(() => {
    if (!cart?.items) return 0;
    return cart.items.reduce(
      (sum, item) => sum + item.unit_price_sar * item.quantity,
      0
    );
  }, [cart?.items]);

  // إزالة selectedProvider - سنستخدم ShipLink مباشرة

  // التحقق من اكتمال جميع بيانات العميل
  const isCustomerDataComplete = useMemo(() => {
    return !!(
      customerInfo.name?.trim() &&
      customerInfo.phone?.trim() &&
      customerInfo.city?.trim() &&
      customerInfo.street?.trim() &&
      customerInfo.nationalAddressCode?.trim() // ✅ الرمز الوطني إجباري
    );
  }, [customerInfo.name, customerInfo.phone, customerInfo.city, customerInfo.street, customerInfo.nationalAddressCode]);

  const shippingCost = useMemo(() => {
    // استخدام سعر carrier المختار من ShipLink
      if (selectedCarrierId) {
        const selectedCarrier = bolesaCarriers.find(
          (c) => c.carrier_id === selectedCarrierId
        );
      const carrierName = selectedCarrier?.carrier_name?.toLowerCase() || '';
      
      // تسعير خاص لـ SMSA و Aramex
      if (carrierName.includes('smsa') || carrierName.includes('aramex')) {
        // 35 ر.س عند الدفع عند الاستلام، 30 ر.س عند الدفع المسبق
        return paymentMethod === 'cod' ? 35 : 30;
      }
      
      return selectedCarrier?.price || bolesaRate || 0;
    }
    return bolesaRate || 0;
  }, [
    bolesaRate,
    bolesaCarriers,
    selectedCarrierId,
    paymentMethod,
  ]);

  // استخدام ref لتتبع آخر طلب لتجنب التكرار
  const lastRequestRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  // جلب شركات الشحن مباشرة من ShipLink عند اكتمال جميع البيانات
  useEffect(() => {
    // التأكد من اكتمال جميع البيانات المطلوبة
    const requiredFieldsComplete = !!(
      customerInfo.name?.trim() &&
      customerInfo.phone?.trim() &&
      customerInfo.city?.trim() &&
      customerInfo.street?.trim() &&
      customerInfo.nationalAddressCode?.trim() // ✅ الرمز الوطني إجباري
    );

    if (!requiredFieldsComplete) {
      // إذا لم تكتمل البيانات، لا نجلب شركات الشحن
      setBolesaCarriers([]);
      setSelectedCarrierId(null);
      setBolesaRate(null);
      lastRequestRef.current = null;
      return;
    }

    // التأكد من تحميل معلومات المتجر أولاً
    // نحتاج إما storeInfo.shop_id أو storeInfo.bolesa_vendor_id
    if (!storeInfo) {
      console.log("[CheckoutPage] Waiting for store info to load...");
      return;
    }

    const destinationCityId = getCityId(customerInfo.city);
    if (!destinationCityId) {
      setBolesaCarriers([]);
      setSelectedCarrierId(null);
      setBolesaRate(null);
      lastRequestRef.current = null;
      return;
    }

    // إنشاء مفتاح فريد للطلب لتجنب التكرار
    const requestKey = `${customerInfo.city}-${cart?.items?.length || 0}-${paymentMethod}-${subtotal}-${storeInfo?.shop_id || storeInfo?.bolesa_vendor_id || 'no-vendor'}`;
    
    // تجنب إرسال طلب مكرر
    if (lastRequestRef.current === requestKey || isFetchingRef.current) {
      console.log("[CheckoutPage] Skipping duplicate request:", requestKey);
      return;
    }

    const fetchCarriersFromShipLink = async () => {
      // التأكد من عدم إرسال طلب آخر في نفس الوقت
      if (isFetchingRef.current) {
        console.log("[CheckoutPage] Already fetching, skipping...");
        return;
      }

      isFetchingRef.current = true;
      lastRequestRef.current = requestKey;
      setBolesaCarriersLoading(true);
      
      try {
        const totalWeight = Math.max(
          1,
          cart?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1
        );

        const originCityName = "الرياض";
        const originCityId =
          getCityId(originCityName) ||
          bolesaCities.find(
            (c) => c.name === originCityName || c.name_en === "Riyadh"
          )?.id;

        if (!originCityId) {
          console.error("[CheckoutPage] Origin city ID not found");
          setBolesaCarriers([]);
          setBolesaCarriersLoading(false);
          return;
        }

        // التأكد من وجود عناصر في السلة
        if (!cart?.items || cart.items.length === 0) {
          console.warn("[CheckoutPage] No cart items found, skipping carrier fetch");
          setBolesaCarriersLoading(false);
          return;
        }

        console.log("[CheckoutPage] Fetching carriers from ShipLink:", {
          origin_city_id: originCityId,
          destination_city_id: destinationCityId,
          weight: totalWeight,
          cod_amount: paymentMethod === "cod" ? subtotal : 0,
          cart_items_count: cart.items.length,
        });

        // الحصول على vendor_id - أولوية لـ bolesa_vendor_id ثم shop_id
        let vendorId: number | null = null;
        
        // أولوية 1: استخدام bolesa_vendor_id إذا كان موجوداً
        if (storeInfo?.bolesa_vendor_id && storeInfo.bolesa_vendor_id > 0) {
          vendorId = storeInfo.bolesa_vendor_id;
          console.log("[CheckoutPage] ✅ Using bolesa_vendor_id:", vendorId);
        } else {
          // أولوية 2: محاولة استخدام shop_id إذا كان رقماً
          const shopIdRaw = storeInfo?.shop_id || (store as any)?.shop_id;
          
          if (shopIdRaw) {
            const isUUID = String(shopIdRaw).includes('-');
            const parsedVendorId = parseInt(String(shopIdRaw), 10);
            
            if (!isNaN(parsedVendorId) && parsedVendorId > 0 && !isUUID) {
              vendorId = parsedVendorId;
              console.log("[CheckoutPage] ✅ Using numeric shop_id as vendor_id:", vendorId);
            } else if (isUUID) {
              console.warn("[CheckoutPage] ⚠️ shop_id is UUID, need bolesa_vendor_id:", shopIdRaw);
            }
          }
        }
        
        // إذا لم نجد vendor_id، نستخدم قيمة افتراضية
        // vendor_id هو معرف داخلي في ShipLink - يمكن استخدام أي رقم فريد
        if (!vendorId || vendorId <= 0) {
          // استخدام رقم ثابت كـ vendor_id (يمكن تغييره حسب الحاجة)
          // هذا الرقم يمثل معرف البائع في نظام ShipLink
          vendorId = 13; // رقم افتراضي - يمكن تغييره
          console.log("[CheckoutPage] Using default vendor_id:", vendorId);
        }
        
        console.log("[CheckoutPage] Using vendor_id:", vendorId);

        console.log("[CheckoutPage] Fetching all available carriers:", {
          origin_city_id: originCityId,
          destination_city_id: destinationCityId,
          weight: totalWeight,
          payment_type: paymentMethod === "cod" ? "cod" : "cc",
        });

        // جلب جميع شركات الشحن المتاحة من available-carriers endpoint
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://atlback-8yq4.vercel.app';
        const carriersResponse = await fetch(
          `${BACKEND_URL}/api/bolesa/available-carriers?origin_city_id=${originCityId}&destination_city_id=${destinationCityId}&weight=${totalWeight}&payment_type=${paymentMethod === "cod" ? "cod" : "cc"}`
        );
        
        const carriersData = await carriersResponse.json();

        if (carriersData.success && carriersData.carriers && carriersData.carriers.length > 0) {
          // دالة لحساب مدة التوصيل الافتراضية بناءً على اسم الشركة
          const getEstimatedDays = (carrierName: string, apiDays?: number): number => {
            if (apiDays && apiDays > 0) return apiDays;
            const name = (carrierName || '').toLowerCase();
            if (name.includes('smsa')) return 2;
            if (name.includes('aramex')) return 3;
            if (name.includes('dhl')) return 2;
            if (name.includes('fedex')) return 3;
            if (name.includes('ups')) return 3;
            if (name.includes('j&t') || name.includes('jnt')) return 4;
            if (name.includes('imile')) return 3;
            if (name.includes('naqel')) return 3;
            if (name.includes('fetchr')) return 4;
            if (name.includes('ajex')) return 3;
            if (name.includes('redbox')) return 3;
            if (name.includes('zajil')) return 3;
            return 3; // افتراضي
          };

          // تحويل response إلى BolesaCarrier format مع مدة التوصيل
          const carriers: BolesaCarrier[] = carriersData.carriers.map((carrier: any) => ({
            carrier_id: carrier.carrier_id || carrier.carrier_name,
            carrier_name: carrier.carrier_name,
            price: carrier.price,
            estimated_days: getEstimatedDays(carrier.carrier_name, carrier.estimated_days),
            service_type: carrier.service_type,
          }));

          // فلترة وترتيب الشركات حسب السعر
          const validCarriers = carriers.filter((c) => c.price && c.price > 0);
          const sortedCarriers = [...validCarriers].sort((a, b) => {
            if (a.price !== b.price) {
              return a.price - b.price;
            }
            return (a.carrier_name || '').localeCompare(b.carrier_name || '');
          });

          console.log('[CheckoutPage] ✅ All carriers loaded:', {
            total: carriersData.carriers.length,
            valid: validCarriers.length,
            sorted: sortedCarriers.length,
            carriers: sortedCarriers.map((c: BolesaCarrier) => ({ name: c.carrier_name, price: c.price, days: c.estimated_days })),
          });

          setBolesaCarriers(sortedCarriers);
          
          // اختيار أول carrier افتراضياً (الأرخص)
          if (!selectedCarrierId && sortedCarriers[0]) {
            setSelectedCarrierId(sortedCarriers[0].carrier_id);
            setBolesaRate(sortedCarriers[0].price);
          }
        } else {
          console.log('[CheckoutPage] No carriers found:', carriersData);
          setBolesaCarriers([]);
          setSelectedCarrierId(null);
          setBolesaRate(null);
        }
      } catch (error: any) {
        console.error("[CheckoutPage] Error fetching carriers:", error);
        setBolesaCarriers([]);
        setSelectedCarrierId(null);
        setBolesaRate(null);
        
        toast({
          title: "خطأ",
          description: error?.message || "فشل في الحصول على شركات الشحن",
          variant: "destructive",
        });
      } finally {
        setBolesaCarriersLoading(false);
        isFetchingRef.current = false;
      }
    };

    // استخدام debounce لمنع التكرار المفرط
    const timeoutId = setTimeout(() => {
      fetchCarriersFromShipLink().catch((error) => {
        console.error("[CheckoutPage] Failed to fetch carriers:", error);
        isFetchingRef.current = false;
      });
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      // إعادة تعيين حالة التحميل عند unmount
      isFetchingRef.current = false;
    };
    // فقط إعادة الجلب عند اكتمال البيانات أو تغيير طريقة الدفع أو storeInfo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    customerInfo.city,
    customerInfo.name,
    customerInfo.phone,
    customerInfo.street,
    cart?.items?.length, // فقط عدد العناصر، وليس المرجع نفسه
    paymentMethod,
    subtotal,
    storeInfo, // إعادة الجلب عند تحميل storeInfo
  ]);

  const taxAmount = useMemo(
    () => (subtotal + shippingCost) * TAX_RATE,
    [subtotal, shippingCost]
  );
  const grandTotal = subtotal + shippingCost + taxAmount;

  // التحقق من صحة النموذج
  const isFormValid = useMemo(() => {
    const baseValid =
      customerInfo.name.trim() !== "" &&
      customerInfo.phone.trim() !== "" &&
      customerInfo.street.trim() !== "" &&
      customerInfo.city.trim() !== "" &&
      customerInfo.nationalAddressCode.trim() !== "" && // ✅ الرمز الوطني إجباري
      paymentMethod !== "";
    
    // يجب أن يكون carrier محدداً
    return baseValid && selectedCarrierId !== null && customerInfo.city.trim() !== "";
  }, [
    customerInfo,
    paymentMethod,
    selectedCarrierId,
  ]);

  // معالجة إنشاء الطلب
  const handlePlaceOrder = async () => {
    if (!isFormValid || !cart?.items?.length) {
      toast({
        title: "خطأ",
        description: "يرجى إكمال جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    // التحقق من أن شركة الشحن محددة
    if (!selectedCarrierId) {
      console.error("❌ No carrier selected:", {
        selectedCarrierId,
        bolesaCarriers: bolesaCarriers.length,
      });
      toast({
        title: "خطأ",
        description: "يرجى اختيار شركة الشحن",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // الحصول على affiliate_store_id أولاً
      const affiliateStoreId =
        storeInfo?.id ||
        store?.id ||
        localStorage.getItem("storefront:last-store-id");
      
      // الحصول على shop_id (يجب أن يكون مختلف عن affiliate_store_id)
      let shopId = storeInfo?.shop_id;
      
      // التأكد من أن shop_id ليس نفس affiliate_store_id (خطأ شائع)
      if (shopId === affiliateStoreId) {
        console.warn(
          "⚠️ shop_id equals affiliate_store_id - this is incorrect, resetting shop_id"
        );
        shopId = undefined;
      }

      console.log("🔍 Initial values:", {
        shopId,
        affiliateStoreId,
        storeInfo,
        store,
      });

      // إذا لم نجد shop_id، نحصل عليه من المنتج مباشرة
      if (!shopId && cart?.items?.[0]) {
        console.log("🔍 Getting shop_id from cart item...");
        const firstItem = cart.items[0];
        const { data: productData, error: productError } = await supabasePublic
          .from("products")
          .select("shop_id")
          .eq("id", firstItem.product_id)
          .maybeSingle();
        
        if (productError) {
          console.error("❌ Error fetching product:", productError);
        } else if (productData?.shop_id) {
          shopId = productData.shop_id;
          console.log("✅ Found shop_id from product:", shopId);
        }
      }

      // إذا لم نجد shop_id بعد، نحصل على أي shop متوفر
      if (!shopId) {
        console.log("🔍 Trying to get any available shop...");
        const { data: anyShop, error: shopError } = await supabasePublic
          .from("shops")
          .select("id")
          .limit(1)
          .maybeSingle();
        
        if (shopError) {
          console.error("❌ Error fetching shop:", shopError);
        } else if (anyShop?.id) {
          shopId = anyShop.id;
          console.log("✅ Using first available shop:", shopId);
        }
      }

      // التحقق من affiliate_store_id (مطلوب من Edge Function)
      if (!affiliateStoreId) {
        console.error("❌ No affiliate_store_id found!", {
          storeInfo,
          store,
          cart,
        });
        toast({
          title: "خطأ",
          description: "لم يتم العثور على معلومات المتجر. حاول مرة أخرى.",
          variant: "destructive",
        });
        throw new Error("معرف المتجر غير موجود");
      }

      // التحقق من shop_id
      if (!shopId) {
        console.error("❌ No shop_id found after all attempts!");
        toast({
          title: "خطأ",
          description: "لم يتم العثور على متجر صالح. تواصل مع الدعم.",
          variant: "destructive",
        });
        throw new Error("معرف المتجر غير موجود");
      }

      console.log("✅ Final IDs:", { shopId, affiliateStoreId });

      // تحديد payment_method الصحيح (يجب أن يتطابق مع enum في قاعدة البيانات)
      let finalPaymentMethod = "CASH_ON_DELIVERY";
      if (paymentMethod === "geidea") {
        finalPaymentMethod = "CREDIT_CARD"; // Geidea = بطاقة ائتمان (يدعم Apple Pay أيضاً)
      }

      // إنشاء payload الطلب
      const orderPayload = {
        cart_id: cart.id || null,
        shop_id: shopId, // تم الحصول عليه من المنتج أو أول shop متوفر
          affiliate_store_id: affiliateStoreId,
          buyer_session_id: null,
          customer: {
            name: customerInfo.name,
            email: customerInfo.email || null,
            phone: customerInfo.phone,
            nationalAddressCode: customerInfo.nationalAddressCode || null, // ✅ الرمز الوطني (لتحديد العنوان)
            address: {
              street: customerInfo.street,
              city: customerInfo.city,
            district: customerInfo.district || null,
            postalCode: customerInfo.postalCode || null,
            notes: customerInfo.notes || null,
          },
          },
          shipping: {
            cost_sar: shippingCost,
            provider_name: selectedCarrierId ? bolesaCarriers.find((c) => c.carrier_id === selectedCarrierId)?.carrier_name || null : null,
            provider_id: selectedCarrierId || null,
            provider_code: selectedCarrierId ? String(selectedCarrierId) : null,
            service_type: null,
            notes: customerInfo.notes || null,
          },
        payment_method: finalPaymentMethod,
      };

      console.log("📦 Creating order with payload:", orderPayload);
      console.log("📦 Shipping info:", {
        selectedCarrierId,
        selectedCarrier: bolesaCarriers.find((c) => c.carrier_id === selectedCarrierId),
        payloadProviderCode: orderPayload.shipping.provider_code,
      });

      // إنشاء الطلب عبر Backend API
      let orderId: string | null = null;
      let orderNumber: string | null = null;
      
      try {
        const BACKEND_URL =
          import.meta.env.VITE_BACKEND_URL || "https://atlback-8yq4.vercel.app";
        const response = await fetch(`${BACKEND_URL}/api/orders/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        });
        
        const data = await response.json();
        const error = !response.ok
          ? { message: data.error || "فشل في إنشاء الطلب" }
          : null;

        console.log("📬 Order response:", { data, error });

        if (!error && data?.success && data?.order_id) {
          orderId = data.order_id;
          orderNumber = data.order_number;
          console.log("✅ Order created via Backend API:", {
            orderId,
            orderNumber,
          });
        } else {
          console.error("❌ Backend API failed:", error);
          throw new Error(
            error?.message || data?.error || "فشل في إنشاء الطلب"
          );
        }
      } catch (apiError: any) {
        console.error("❌ Backend API error:", apiError);
        throw apiError;
      }

      if (!orderId) {
        toast({
          title: "خطأ",
          description: "فشل في إنشاء الطلب",
          variant: "destructive",
        });
        return;
      }

      setCurrentOrderId(orderId);

      // معالجة طرق الدفع المختلفة
      if (paymentMethod === "geidea") {
        // الدفع الإلكتروني - عرض Geidea مباشرة في الصفحة (بدون Dialog أو navigate)
        // Geidea SDK يدعم Apple Pay داخل نفس iframe
        setCurrentPaymentMethod("geidea");
        setShowPayment(true);
        return; // Exit early - payment will show in same page
      } else {
        // الدفع عند الاستلام - تفريغ السلة وإنشاء الشحنة مباشرة
        // إنشاء شحنة ShipLink بعد إنشاء الطلب
        if (selectedCarrierId && orderId && orderNumber) {
        console.log(
          "[CheckoutPage] ✅ Creating Bolesa shipment for order:",
          orderId,
          orderNumber
        );
        try {
          await createBolesaShipment(orderId, orderNumber);
          console.log(
            "[CheckoutPage] ✅ createBolesaShipment completed successfully"
          );
        } catch (error: any) {
          console.error("[CheckoutPage] ❌ createBolesaShipment failed:", {
            error: error.message,
            stack: error.stack,
            fullError: error,
            timestamp: new Date().toISOString(),
          });
          // Don't fail the whole order if Bolesa shipment creation fails
          toast({
            title: "تحذير",
            description:
              "تم إنشاء الطلب بنجاح، لكن فشل في إنشاء الشحنة مع Bolesa. سيتم التواصل معك قريباً.",
            variant: "default",
          });
        }
      }

        // تفريغ السلة للدفع عند الاستلام
        await clearCart();
        toast({
          title: "تم إنشاء الطلب بنجاح",
          description: "سيتم التواصل معك قريباً وإرسال الفاتورة",
        });
        // تمرير slug المتجر مع رابط التأكيد
        const currentSlug =
          storeSlug ||
          store?.store_slug ||
          localStorage.getItem("current_store_slug") ||
          "";
        navigate(`/order/confirmation?orderId=${orderId}&slug=${currentSlug}`);
      }

      // إنشاء فاتورة في Zoho (في الخلفية) - فقط للدفع عند الاستلام
      if (paymentMethod === "cod" && orderId) {
        createZohoInvoice(orderId, orderNumber ?? undefined);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الطلب",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // إنشاء شحنة Bolesa باستخدام API
  const createBolesaShipment = async (orderId: string, orderNum?: string) => {
    console.log("[Bolesa] 🚀 Creating shipment for order:", orderId, orderNum);

    if (!customerInfo.city) {
      throw new Error("City is required for Bolesa shipment");
    }

    const BACKEND_URL =
      import.meta.env.VITE_BACKEND_URL || "https://atlback-8yq4.vercel.app";

    try {
      const totalWeight = Math.max(
        1,
        cart?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1
      );

      const destinationCityId = getCityId(customerInfo.city);
      if (!destinationCityId) {
        throw new Error(`City ID not found for: ${customerInfo.city}`);
      }

      const originCityName = "الرياض";
      const originCityId =
        getCityId(originCityName) ||
        bolesaCities.find(
          (c) => c.name === originCityName || c.name_en === "Riyadh"
        )?.id;

      if (!originCityId) {
        throw new Error(`Origin city ID not found for: ${originCityName}`);
      }

      // بناء payload للـ API
      const shipmentData = {
        order_id: orderId,
        order_number: orderNum || `ORD-${orderId.slice(-8)}`,
        customer: {
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email || undefined,
          nationalAddressCode: customerInfo.nationalAddressCode || undefined, // ✅ الرمز الوطني (لتحديد العنوان)
        },
        sender: {
          name: store?.store_name || "المتجر",
          phone: "0500000000",
          address: "الرياض",
          city_id: originCityId,
        },
        shipping_address: {
          street: customerInfo.street,
          city: customerInfo.city,
          city_id: destinationCityId,
          postalCode: customerInfo.postalCode || "",
          district: customerInfo.district || "",
        },
        items: cart?.items?.map((item) => ({
            title: item.product_title || "منتج",
          name: item.product_title || "منتج",
          quantity: item.quantity || 1,
          unit_price_sar: item.unit_price_sar,
          weight_kg: 0.5, // Default weight per item
        })) || [],
        totals: {
          subtotal: subtotal,
          shipping: shippingCost,
          tax: taxAmount,
          total: grandTotal,
          cod_amount: paymentMethod === "cod" ? grandTotal : 0,
        },
        weight_kg: totalWeight,
        pieces: cart?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1,
        carrier_id: selectedCarrierId || undefined,
        vendor_id: storeInfo?.bolesa_vendor_id || undefined,
      };
      
      console.log("[Bolesa] 📤 Sending shipment request:", shipmentData);

      const response = await fetch(`${BACKEND_URL}/api/bolesa/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify(shipmentData),
        });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create AWB");
      }

      const trackingNumber = result.awb_number || result.tracking_number;

      console.log("[Bolesa] ✅ Shipment created successfully. AWB:", trackingNumber);

        toast({
          title: "تم إنشاء الشحنة",
        description: `تم إنشاء الشحنة بنجاح. رقم التتبع: ${trackingNumber}`,
      });

      // حفظ tracking number في قاعدة البيانات
      if (trackingNumber) {
        try {
          const { error: updateError } = await supabasePublic
            .from("ecommerce_orders")
            .update({
              tracking_number: trackingNumber,
              shipping_provider: "bolesa",
              shipped_at: new Date().toISOString(),
            })
            .eq("id", orderId);

          if (updateError) {
            console.error("[Bolesa] Error updating order:", updateError);
          }
        } catch (updateError) {
          console.error("[Bolesa] Error updating order:", updateError);
        }
      }
    } catch (error: any) {
      console.error("[Bolesa] ❌ Shipment creation error:", {
        error,
        message: error?.message,
        stack: error?.stack,
      });
      const errorMessage = error?.message || "خطأ غير معروف";
      toast({
        title: "تحذير",
        description: `فشل في إنشاء شحنة Bolesa: ${errorMessage}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  // إنشاء فاتورة في Zoho
  const createZohoInvoice = async (orderId: string, orderNum?: string) => {
    const BACKEND_URL =
      import.meta.env.VITE_BACKEND_URL || "https://atlback-8yq4.vercel.app";
    
    try {
      console.log(
        "[Zoho] Creating invoice for order:",
        orderId,
        "orderNum:",
        orderNum
      );
      console.log("[Zoho] Customer info:", customerInfo);
      console.log("[Zoho] Cart items:", cart?.items);
      
      const invoiceData = {
        order_id: orderId,
        order_number: orderNum || `ORD-${orderId.slice(-8)}`,
        customer: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          nationalAddressCode: customerInfo.nationalAddressCode || undefined, // ✅ الرمز الوطني (لتحديد العنوان)
          address: {
            street: customerInfo.street,
            city: customerInfo.city,
            region: customerInfo.district,
            postalCode: customerInfo.postalCode,
          },
        },
        items:
          cart?.items?.map((item) => ({
          product_id: item.product_id,
            title: item.product_title || "منتج",
          quantity: item.quantity,
          unit_price_sar: item.unit_price_sar,
        })) || [],
        totals: {
          subtotal: subtotal,
          shipping: shippingCost,
          tax: taxAmount,
          total: grandTotal,
        },
        send_email: !!customerInfo.email,
      };
      
      console.log(
        "[Zoho] Sending invoice request:",
        JSON.stringify(invoiceData, null, 2)
      );
      
      const response = await fetch(`${BACKEND_URL}/api/zoho/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      });

      const data = await response.json();
      console.log("[Zoho] Response:", data);
      
      if (data.success) {
        console.log(
          "[Zoho] ✅ Invoice created successfully:",
          data.invoice_number
        );
      } else {
        console.warn("[Zoho] ❌ Failed to create invoice:", data.error);
      }
    } catch (error) {
      console.error("[Zoho] ❌ Invoice creation error (non-blocking):", error);
      // لا نوقف العملية إذا فشل إنشاء الفاتورة
    }
  };

  // معالجة نجاح الدفع
  const handlePaymentSuccess = async (_paymentData?: any) => {
    setShowPayment(false);
    setCurrentPaymentMethod(null);
    
    if (!currentOrderId) {
      console.error("[CheckoutPage] No order ID available for payment success");
      return;
    }

    try {
      // إنشاء شحنة Bolesa بعد اتمام الدفع
      if (selectedCarrierId && currentOrderId) {
        const orderNumber = `ORD-${currentOrderId.slice(-8)}`;
        console.log(
          "[CheckoutPage] ✅ Creating Bolesa shipment after payment success:",
          currentOrderId,
          orderNumber
        );
        try {
          await createBolesaShipment(currentOrderId, orderNumber);
          console.log(
            "[CheckoutPage] ✅ createBolesaShipment completed successfully after payment"
          );
        } catch (error: any) {
          console.error("[CheckoutPage] ❌ createBolesaShipment failed after payment:", {
            error: error.message,
            stack: error.stack,
            fullError: error,
            timestamp: new Date().toISOString(),
          });
          // Don't fail the whole process if Bolesa shipment creation fails
          toast({
            title: "تحذير",
            description:
              "تم الدفع بنجاح، لكن فشل في إنشاء الشحنة مع Bolesa. سيتم التواصل معك قريباً.",
            variant: "default",
          });
        }
      }

      // إنشاء فاتورة في Zoho بعد اتمام الدفع
      createZohoInvoice(currentOrderId, `ORD-${currentOrderId.slice(-8)}`);

      // تفريغ السلة بعد اتمام الدفع
    await clearCart();
      
    toast({
      title: "تم الدفع بنجاح",
      description: "شكراً لك، تم إتمام طلبك وسيتم إرسال الفاتورة",
    });
      
    // تمرير slug المتجر مع رابط التأكيد
    const currentSlug =
      storeSlug ||
      store?.store_slug ||
      localStorage.getItem("current_store_slug") ||
      "";
    navigate(
      `/order/confirmation?orderId=${currentOrderId}&slug=${currentSlug}`
    );
    } catch (error) {
      console.error("[CheckoutPage] Error in handlePaymentSuccess:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء معالجة الدفع الناجح",
        variant: "destructive",
      });
    }
  };

  // معالجة إلغاء الدفع
  const handlePaymentCancel = () => {
    console.log("[CheckoutPage] Payment cancelled by user");
    setShowPayment(false);
    setCurrentPaymentMethod(null);
    // لا يتم تفريغ السلة عند الإلغاء
    // لا يتم إنشاء شحنة
    toast({
      title: "تم الإلغاء",
      description: "تم إلغاء عملية الدفع",
    });
  };

  // معالجة فشل الدفع
  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error);
    setShowPayment(false);
    setCurrentPaymentMethod(null);
    // لا يتم تفريغ السلة عند الفشل
    toast({
      title: "فشل الدفع",
      description: error,
      variant: "destructive",
    });
  };

  // التحميل
  if (cartLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="text-muted-foreground">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  // العربة فارغة
  if (!cart?.items?.length) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <UnifiedCard className="w-full max-w-md p-8 text-center">
          <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-semibold">العربة فارغة</h1>
          <p className="mb-6 text-muted-foreground">
            لا توجد منتجات في عربة التسوق
          </p>
              <UnifiedButton
                variant="default"
            onClick={() => navigate(`/${storeSlug || store?.store_slug}`)}
              >
            العودة للتسوق
              </UnifiedButton>
        </UnifiedCard>
      </div>
    );
  }

  return (
    <div
      className={`${
        isDarkMode
          ? "bg-black"
          : "bg-white"
      }`}
      data-page="checkout"
    >
      {/* تطبيق لون الثيم على جميع عناصر الإدخال والأزرار في صفحة الدفع */}
      <style>{`
        [data-page="checkout"] input,
        [data-page="checkout"] textarea,
        [data-page="checkout"] select,
        [data-page="checkout"] [role="combobox"] {
          border: 1.5px solid hsl(var(--primary) / 0.5) !important;
          background: ${isDarkMode ? 'hsl(0 0% 5%)' : '#ffffff'} !important;
        }
        [data-page="checkout"] input:focus,
        [data-page="checkout"] textarea:focus,
        [data-page="checkout"] select:focus,
        [data-page="checkout"] [role="combobox"]:focus {
          border-color: hsl(var(--primary)) !important;
          box-shadow: 0 0 0 3px hsl(var(--primary) / 0.15) !important;
        }
        [data-page="checkout"] input::placeholder,
        [data-page="checkout"] textarea::placeholder {
          color: ${isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(107,114,128,0.8)'} !important;
        }
        [data-page="checkout"] .place-order,
        [data-page="checkout"] [data-button-type="place-order"] {
          background: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
          border: none !important;
          font-weight: 700 !important;
          font-size: 1.05rem !important;
        }
        [data-page="checkout"] .place-order:hover:not(:disabled),
        [data-page="checkout"] [data-button-type="place-order"]:hover:not(:disabled) {
          opacity: 0.9;
          box-shadow: 0 4px 14px hsl(var(--primary) / 0.35) !important;
        }
      `}</style>
      <div className="container mx-auto max-w-6xl px-4 py-6 pb-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
          <UnifiedButton
            variant="ghost"
            size="sm"
              onClick={() => {
                if (storeSlug) {
                  navigate(`/${storeSlug}`);
                } else {
                  navigate(-1);
                }
              }}
              leftIcon={
                <ChevronLeft
                  className={`h-4 w-4 ${isDarkMode ? "!text-white" : ""}`}
                />
              }
              className={isDarkMode ? "!text-white hover:!bg-gray-800" : ""}
          >
            العودة
          </UnifiedButton>
          <div>
              <h1
                className={`text-3xl font-bold ${
                  "!text-primary"
                }`}
              >
                إتمام الشراء
              </h1>
              <p className={isDarkMode ? "!text-white" : "!text-gray-600"}>
                أكمل بياناتك لإتمام الطلب
              </p>
          </div>
        </div>
          <UnifiedBadge
            variant="secondary"
            className={
              isDarkMode
                ? "!bg-gray-900 !border-primary !text-white"
                : "!bg-white !border-primary !text-gray-900"
            }
          >
            {cart.items.length} {cart.items.length === 1 ? "منتج" : "منتجات"}
        </UnifiedBadge>
        </div>

        <div className="space-y-6">
          {/* الصف الأول: بيانات العميل وملخص الطلب */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* بيانات العميل */}
            <div className="lg:col-span-2">
              <UnifiedCard
                className={`p-6 h-full ${
                  isDarkMode
                    ? "!bg-gray-900 !border-primary"
                    : "!bg-white !border-primary"
                }`}
              >
              <div className="mb-4 flex items-center gap-2">
                  <User
                    className={`h-5 w-5 ${
                      "!text-primary"
                    }`}
                  />
                  <h2
                    className={`text-xl font-semibold ${
                      "!text-primary"
                    }`}
                  >
                    بيانات العميل
                  </h2>
              </div>

              <div className="space-y-4">
                {/* الصف الأول: الاسم الكامل و رقم الجوال */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                      <Label
                        htmlFor="name"
                        className={
                          isDarkMode ? "!text-white" : "!text-gray-900"
                        }
                      >
                        الاسم الكامل *
                      </Label>
                <UnifiedInput
                      id="name"
                  value={customerInfo.name}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            name: e.target.value,
                          })
                        }
                      placeholder="أدخل اسمك الكامل"
                        className={
                          isDarkMode
                            ? "!bg-gray-900 !border-primary !text-white !placeholder:text-white/90 focus:!border-primary focus:!ring-primary/30"
                            : "!bg-white !border-primary !text-gray-900 !placeholder:text-gray-500 focus:!border-primary focus:!ring-primary/20"
                        }
                />
                </div>
                  <div>
                      <Label
                        htmlFor="phone"
                        className={
                          isDarkMode ? "!text-white" : "!text-gray-900"
                        }
                      >
                        رقم الجوال *
                      </Label>
                <UnifiedInput
                      id="phone"
                      type="tel"
                  value={customerInfo.phone}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            phone: e.target.value,
                          })
                        }
                      placeholder="05xxxxxxxx"
                        className={
                          isDarkMode
                            ? "!bg-gray-900 !border-primary !text-white !placeholder:text-white/90 focus:!border-primary focus:!ring-primary/30"
                            : "!bg-white !border-primary !text-gray-900 !placeholder:text-gray-500 focus:!border-primary focus:!ring-primary/20"
                        }
                    />
              </div>
            </div>

                {/* الصف الثاني: المدينة و الرمز الوطني */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                      <Label
                        htmlFor="city"
                        className={
                          isDarkMode ? "!text-white" : "!text-gray-900"
                        }
                      >
                        المدينة *
                      </Label>
                    <SearchableSelect
                      value={customerInfo.city}
                      onValueChange={(value) => {
                          setCustomerInfo({
                            ...customerInfo,
                            city: value,
                          });
                      }}
                      placeholder="اختر المدينة"
                        options={Array.from(new Set(bolesaCities.map((city) => city.name)))}
                        disabled={bolesaCitiesLoading}
                      searchPlaceholder="ابحث عن المدينة..."
                      isDarkMode={isDarkMode}
                />
              </div>
                  <div>
                      <Label
                        htmlFor="nationalAddressCode"
                        className={
                          isDarkMode ? "!text-white" : "!text-gray-900"
                        }
                      >
                        الرمز الوطني *
                      </Label>
                <UnifiedInput
                      id="nationalAddressCode"
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                  value={customerInfo.nationalAddressCode}
                        onChange={(e) => {
                          // Allow only numbers and limit to 10 digits
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setCustomerInfo({
                            ...customerInfo,
                            nationalAddressCode: value,
                          });
                        }}
                      placeholder="الرمز الوطني للعنوان"
                        className={
                          isDarkMode
                            ? "!bg-gray-900 !border-primary !text-white !placeholder:text-white/90 focus:!border-primary focus:!ring-primary/30"
                            : "!bg-white !border-primary !text-gray-900 !placeholder:text-gray-500 focus:!border-primary focus:!ring-primary/20"
                        }
                    />
                </div>
            </div>

                {/* الصف الثالث: البريد الإلكتروني (يسار) و الرمز البريدي (يمين - بنفس الحجم) */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                      <Label
                        htmlFor="email"
                        className={
                          isDarkMode ? "!text-white" : "!text-gray-900"
                        }
                      >
                        البريد الإلكتروني
                      </Label>
                <UnifiedInput
                      id="email"
                  type="email"
                  value={customerInfo.email}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            email: e.target.value,
                          })
                        }
                      placeholder="example@email.com"
                        className={
                          isDarkMode
                            ? "!bg-gray-900 !border-primary !text-white !placeholder:text-white/90 focus:!border-primary focus:!ring-primary/30"
                            : "!bg-white !border-primary !text-gray-900 !placeholder:text-gray-500 focus:!border-primary focus:!ring-primary/20"
                        }
                />
                </div>
                  <div>
                    <Label
                      htmlFor="postalCode"
                      className={isDarkMode ? "!text-white" : "!text-gray-900"}
                    >
                      الرمز البريدي
                    </Label>
                <UnifiedInput
                      id="postalCode"
                  value={customerInfo.postalCode}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          postalCode: e.target.value,
                        })
                      }
                      placeholder="12345"
                      className={
                        isDarkMode
                          ? "!bg-gray-900 !border-primary !text-white !placeholder:text-white/90 focus:!border-primary focus:!ring-primary/30"
                          : "!bg-white !border-primary !text-gray-900 !placeholder:text-gray-500 focus:!border-primary focus:!ring-primary/20"
                      }
                />
                </div>
            </div>

                {/* العنوان (كامل العرض) */}
                <div>
                    <Label
                      htmlFor="street"
                      className={isDarkMode ? "!text-white" : "!text-gray-900"}
                    >
                      العنوان *
                    </Label>
              <UnifiedInput
                    id="street"
                value={customerInfo.street}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          street: e.target.value,
                        })
                      }
                      placeholder="الشارع"
                      className={
                        isDarkMode
                          ? "!bg-gray-900 !border-primary/50 !text-white !placeholder:text-white/90 focus:!border-primary focus:!ring-primary/30"
                          : "focus:border-primary focus:ring-primary/20"
                      }
                  />
            </div>


                <div>
                    <Label
                      htmlFor="notes"
                      className={isDarkMode ? "!text-white" : "!text-gray-900"}
                    >
                      ملاحظات إضافية
                    </Label>
                  <Textarea
                    id="notes"
                    value={customerInfo.notes}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          notes: e.target.value,
                        })
                      }
                    placeholder="أي ملاحظات خاصة بالطلب"
                    rows={3}
                      className={
                        isDarkMode
                          ? "!bg-gray-900 !border-primary/50 !text-white !placeholder:text-white/90 focus:!border-primary focus:!ring-primary/30"
                          : "focus:border-primary focus:ring-primary/20"
                      }
                />
              </div>
            </div>
              </UnifiedCard>
            </div>

            {/* ملخص الطلب */}
            <div className="lg:col-span-1">
              <UnifiedCard
                className={`sticky top-4 p-6 flex flex-col h-full ${
                  isDarkMode
                    ? "!bg-gray-900 !border-primary/30"
                    : "!bg-white !border-primary"
                }`}
              >
                <h2
                  className={`mb-4 text-xl font-semibold ${
                    "!text-primary"
                  }`}
                >
                  ملخص الطلب
                </h2>

                {/* المنتجات */}
                <div
                  className={`mb-4 space-y-3 border-b pb-4 flex-1 ${
                    isDarkMode ? "border-primary/30" : "border-primary/30"
                  }`}
                >
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={item.product_image_url || "/placeholder.svg"}
                        alt={item.product_title}
                        className={`h-16 w-16 rounded-lg object-cover border ${
                          isDarkMode
                            ? "border-primary/30"
                            : "border-primary/30"
                        }`}
                      />
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            isDarkMode ? "!text-white" : "!text-gray-900"
                          }`}
                        >
                          {item.product_title}
                        </p>
                        <p
                          className={`text-xs ${
                            "!text-primary"
                          }`}
                        >
                          الكمية: {item.quantity} ×{" "}
                          {formatCurrency(item.unit_price_sar)}
                        </p>
                      </div>
                      <p
                        className={`font-semibold ${
                          "!text-primary"
                        }`}
                      >
                        {formatCurrency(item.unit_price_sar * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* المجاميع */}
                <div
                  className={`space-y-2 border-b pb-4 mb-4 ${
                    isDarkMode ? "border-primary/30" : "border-primary/30"
                  }`}
                >
                  <div className="flex justify-between text-sm">
                    <span
                      className={isDarkMode ? "!text-white" : "!text-gray-600"}
                    >
                      المجموع الفرعي
                    </span>
                    <span
                      className={
                        "!text-primary"
                      }
                    >
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span
                      className={isDarkMode ? "!text-white" : "!text-gray-600"}
                    >
                      الشحن
                    </span>
                    <span
                      className={
                        "!text-primary"
                      }
                    >
                      {formatCurrency(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span
                      className={isDarkMode ? "!text-white" : "!text-gray-600"}
                    >
                      ضريبة القيمة المضافة (15%)
                    </span>
                    <span
                      className={
                        "!text-primary"
                      }
                    >
                      {formatCurrency(taxAmount)}
                    </span>
                  </div>
                </div>

                <div className="mb-6 flex justify-between text-lg font-bold">
                  <span
                    className={isDarkMode ? "!text-white" : "!text-gray-900"}
                  >
                    الإجمالي
                  </span>
                  <span
                    className={
                      "!text-primary"
                    }
                  >
                    {formatCurrency(grandTotal)}
                  </span>
                </div>

                <UnifiedButton
                  variant="default"
                  size="lg"
                  fullWidth
                  onClick={handlePlaceOrder}
                  disabled={!isFormValid || isSubmitting}
                  loading={isSubmitting}
                  className="place-order"
                  data-button-type="place-order"
                >
                  {isSubmitting ? "جارٍ إنشاء الطلب..." : "إتمام الطلب"}
                </UnifiedButton>

                <p
                  className={`mt-4 text-center text-xs ${
                    isDarkMode ? "!text-white" : "text-gray-600"
                  }`}
                >
                  بالمتابعة، أنت توافق على الشروط والأحكام
                </p>
              </UnifiedCard>
            </div>
          </div>

          {/* الصف الثاني: طريقة الشحن وطريقة الدفع */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* طريقة الشحن */}
            <div>
              {/* خيارات الشحن */}
              <UnifiedCard
                className={`p-6 ${
                  isDarkMode
                    ? "!bg-gray-900 !border-primary/30"
                    : "!bg-white !border-primary"
                }`}
              >
                <div className="mb-4 flex items-center gap-2">
                  <Truck
                    className={`h-5 w-5 ${
                      "!text-primary"
                    }`}
                  />
                  <h2
                    className={`text-xl font-semibold ${
                      "!text-primary"
                    }`}
                  >
                    طريقة الشحن
                  </h2>
                </div>

              {/* عرض شركات الشحن مباشرة من ShipLink */}
              <div className="mb-4">
                  <Label
                    className={`mb-2 block ${
                      isDarkMode ? "!text-white" : "!text-gray-900"
                    }`}
                  >
                    شركة الشحن
                  </Label>
                {isCustomerDataComplete ? (
                <div className="space-y-3">
                        {bolesaCarriersLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <div
                              className={`h-6 w-6 animate-spin rounded-full border-2 ${
                                isDarkMode
                                  ? "!border-primary"
                                  : "!border-primary"
                              } border-t-transparent`}
                            ></div>
                            <p
                              className={`mr-3 text-sm ${
                                isDarkMode ? "!text-white" : "text-gray-600"
                              }`}
                            >
                              جاري جلب شركات الشحن...
                            </p>
                          </div>
                        ) : !bolesaCarriersLoading && bolesaCarriers.length > 0 ? (
                          bolesaCarriers.map((carrier, index) => {
                            const isSelected = selectedCarrierId !== null && String(selectedCarrierId) === String(carrier.carrier_id);
                            const isBestOption = index === 0 && carrier.price;
                            const uniqueKey = `carrier-${carrier.carrier_id || index}-${index}`;
                            
                            // حساب السعر المعروض بناءً على نوع الشركة وطريقة الدفع
                            const carrierNameLower = (carrier.carrier_name || '').toLowerCase();
                            const isSmsaOrAramex = carrierNameLower.includes('smsa') || carrierNameLower.includes('aramex');
                            const displayPrice = isSmsaOrAramex 
                              ? (paymentMethod === 'cod' ? 35 : 30) 
                              : (carrier.price || 0);
                            
                            return (
                              <button
                                key={uniqueKey}
                                onClick={() => {
                                  setSelectedCarrierId(carrier.carrier_id);
                                  setBolesaRate(carrier.price);
                                }}
                                disabled={!customerInfo.city}
                                className={`w-full rounded-lg border-2 p-4 text-right transition-all duration-300 ${
                                  isSelected
                                    ? isDarkMode
                                      ? "!border-primary !bg-gray-900 scale-[1.02]"
                                      : "border-primary bg-primary/10 scale-[1.02]"
                                    : isDarkMode
                                    ? "!border-primary/30 !bg-gray-900 hover:!border-primary/50"
                                    : "!border-primary/30 !bg-white hover:!border-primary/50"
                                } ${
                                  !customerInfo.city
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                        >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 justify-end mb-1">
                                      <p
                                        className={`font-semibold ${
                                          isDarkMode ? "!text-white" : "!text-gray-900"
                                        }`}
                                      >
                                        {carrier.carrier_name || `شركة الشحن ${index + 1}`}
                                      </p>
                                      {isBestOption && (
                                        <span
                                          className={`text-xs px-2 py-1 rounded-full font-medium bg-primary/20`}
                                          style={{ color: 'hsl(var(--primary))' }}
                                        >
                                          الأفضل
                                        </span>
                              )}
                            </div>
                                    {carrier.service_type && (
                                        <p
                                          className={`text-xs ${
                                            isDarkMode ? "!text-white/70" : "text-gray-500"
                                          }`}
                                        >
                                          {carrier.service_type}
                                        </p>
                                    )}
                                </div>
                                  <div className="text-left flex flex-col items-end">
                                  <p
                                    className={`text-lg font-bold ${
                                      "!text-primary"
                                    }`}
                                  >
                                      {formatCurrency(displayPrice)}
                                    </p>
                                    <p
                                      className={`text-xs mt-1 ${
                                        isDarkMode ? "!text-white/80" : "!text-gray-500"
                                      }`}
                                    >
                                      🚚 {carrier.estimated_days || 3} {(carrier.estimated_days || 3) === 1 ? 'يوم' : 'أيام'}
                                    </p>
                                  </div>
                          </div>
                        </button>
                            );
                          })
                        ) : !bolesaCarriersLoading && isCustomerDataComplete && bolesaCarriers.length === 0 ? (
                          <div
                            className={`mt-2 p-4 rounded-lg border-2 ${
                              isDarkMode
                                ? "!border-red-500/50 !bg-red-900/20"
                                : "!border-red-500 !bg-red-50"
                            }`}
                          >
                            <p
                              className={`text-sm font-semibold ${
                                isDarkMode ? "!text-red-400" : "!text-red-700"
                              }`}
                            >
                              ⚠️ لا توجد شركات شحن متاحة
                          </p>
                            <p
                              className={`text-xs mt-1 ${
                                isDarkMode ? "!text-red-300" : "!text-red-600"
                              }`}
                            >
                              المسار من الرياض إلى {customerInfo.city} غير متاح
                              حالياً في Bolesa.
                          </p>
                        </div>
                        ) : !isCustomerDataComplete ? (
                          <div
                            className={`p-4 rounded-lg border-2 ${
                          isDarkMode
                                ? "!border-primary/30 !bg-primary/5"
                                : "!border-primary/30 !bg-primary/5"
                            }`}
                          >
                            <p
                              className={`text-sm text-center font-medium ${
                                "!text-primary"
                              }`}
                            >
                              📝 أكمل بياناتك لعرض شركات الشحن
                            </p>
                            <div
                              className={`text-xs text-center mt-2 space-y-1 ${
                                isDarkMode ? "!text-white/70" : "!text-gray-500"
                              }`}
                            >
                              {!customerInfo.name?.trim() && <p>• الاسم الكامل</p>}
                              {!customerInfo.phone?.trim() && <p>• رقم الجوال</p>}
                              {!customerInfo.city?.trim() && <p>• المدينة</p>}
                              {!customerInfo.street?.trim() && <p>• العنوان</p>}
                              {!customerInfo.nationalAddressCode?.trim() && <p>• الرمز الوطني</p>}
                        </div>
                          </div>
                        ) : null
                      }
                </div>
                ) : (
                  <div
                    className={`p-4 rounded-lg border-2 ${
                      isDarkMode
                        ? "!border-primary/30 !bg-primary/5"
                        : "!border-primary/30 !bg-primary/5"
                    }`}
                  >
                    <p
                      className={`text-sm text-center font-medium ${
                              "!text-primary"
                            }`}
                          >
                      📝 أكمل بياناتك لعرض شركات الشحن
                    </p>
                    <div
                      className={`text-xs text-center mt-2 space-y-1 ${
                        isDarkMode ? "!text-white/70" : "!text-gray-500"
                      }`}
                    >
                      {!customerInfo.name?.trim() && <p>• الاسم الكامل</p>}
                      {!customerInfo.phone?.trim() && <p>• رقم الجوال</p>}
                      {!customerInfo.city?.trim() && <p>• المدينة</p>}
                      {!customerInfo.street?.trim() && <p>• العنوان</p>}
                      {!customerInfo.nationalAddressCode?.trim() && <p>• الرمز الوطني</p>}
                      </div>
                    </div>
                  )}
                </div>
            </UnifiedCard>
            </div>

            {/* طريقة الدفع */}
            <div>
              <UnifiedCard
                className={`p-6 h-full ${
                  isDarkMode
                    ? "!bg-gray-900 !border-primary"
                    : "!bg-white !border-primary"
                }`}
              >
                <div className="mb-4 flex items-center gap-2">
                  <CreditCard
                    className={`h-5 w-5 ${
                      "!text-primary"
                    }`}
                  />
                  <h2
                    className={`text-xl font-semibold ${
                      "!text-primary"
                    }`}
                  >
                    طريقة الدفع
                  </h2>
                </div>

                <div className="space-y-3">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`w-full rounded-lg border-2 p-4 text-right transition-all duration-300 ${
                          paymentMethod === method.id
                            ? isDarkMode
                              ? "!border-primary !bg-gray-900 scale-[1.02]"
                              : "border-primary bg-primary/10 scale-[1.02]"
                            : isDarkMode
                              ? "!border-primary/30 !bg-gray-900 hover:!border-primary/50"
                              : "!border-primary/30 !bg-white hover:!border-primary/50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon
                            className={`mt-1 h-5 w-5 ${
                              "!text-primary"
                            }`}
                          />
                          <div className="flex-1">
                            <p
                              className={`font-semibold ${
                                isDarkMode ? "!text-white" : "!text-gray-900"
                              }`}
                            >
                              {method.title}
                            </p>
                            <p
                              className={`text-sm ${
                                isDarkMode ? "!text-white" : "text-gray-600"
                              }`}
                            >
                              {method.description}
                            </p>
                  </div>
                        </div>
                      </button>
                    );
                  })}
            </div>
          </UnifiedCard>
        </div>
      </div>

          {/* عرض iframe الدفع مباشرة في نفس الصفحة (Geidea - يدعم Apple Pay داخل نفس iframe) */}
          {showPayment && currentOrderId && currentPaymentMethod === "geidea" && (
            <div className="mt-6 w-full mb-6" data-payment-wrapper>
            <GeideaPayment
              amount={grandTotal}
              orderId={currentOrderId}
              customerName={customerInfo.name}
              customerEmail={customerInfo.email}
              customerPhone={customerInfo.phone}
              billingAddress={{
                city: customerInfo.city,
                street: customerInfo.street,
                countryCode: 'SAU',
                postalCode: customerInfo.postalCode,
              }}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
                onCancel={() => {
                  setShowPayment(false);
                  setCurrentPaymentMethod(null);
                  handlePaymentCancel();
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
