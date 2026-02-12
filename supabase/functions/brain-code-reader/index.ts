import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Project structure knowledge - key directories and their purposes
const projectStructure = {
  "src/components": "React UI components",
  "src/pages": "Application pages/routes",
  "src/hooks": "Custom React hooks",
  "src/features": "Feature-based modules (atlantis-world, etc.)",
  "src/contexts": "React context providers",
  "src/utils": "Utility functions",
  "src/lib": "Library configurations",
  "src/integrations": "Third-party integrations (Supabase)",
  "src/themes": "Design system themes",
  "supabase/functions": "Edge Functions (backend)",
  "supabase/migrations": "Database migrations"
};

// Key files that define the project
const keyFiles = [
  { path: "src/App.tsx", description: "Main application entry with routing" },
  { path: "src/index.css", description: "Global styles and design tokens" },
  { path: "tailwind.config.ts", description: "Tailwind CSS configuration" },
  { path: "supabase/config.toml", description: "Supabase configuration" },
  { path: "src/integrations/supabase/types.ts", description: "Database types" }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, query } = await req.json();
    
    let result: any = {};

    switch (action) {
      case 'get_structure':
        // Return project structure overview
        result = {
          directories: projectStructure,
          keyFiles: keyFiles,
          summary: `المشروع يتبع هيكل React/TypeScript مع:
- ${Object.keys(projectStructure).length} مجلدات رئيسية
- Supabase للـ Backend
- نظام تصميم Anaqati
- 237 جدول في قاعدة البيانات
- 48+ Edge Function`
        };
        break;

      case 'analyze_component':
        // Analyze a specific component type
        result = {
          analysis: `تحليل المكونات في المشروع:
          
🎨 **مكونات UI**: تستخدم shadcn/ui مع تخصيصات Anaqati
📱 **صفحات**: React Router مع حماية المسارات
🎮 **Atlantis**: نظام ألعاب متكامل مع خريطة 3D
💬 **Chat**: نظامين - AI للمسوقين، خدمة عملاء للزبائن
🛒 **E-commerce**: سلة شراء، دفع Geidea، فواتير Zoho`
        };
        break;

      case 'search_code':
        // Search for specific patterns or functionality
        const searchResults = analyzeCodeQuery(query);
        result = searchResults;
        break;

      case 'get_tech_stack':
        result = {
          frontend: ["React 18", "TypeScript", "Tailwind CSS", "Framer Motion", "Three.js"],
          backend: ["Supabase", "PostgreSQL", "Edge Functions (Deno)"],
          integrations: ["Geidea Payment", "Zoho Books", "LiveKit", "Firebase"],
          design: ["Anaqati Theme", "shadcn/ui", "Lucide Icons"]
        };
        break;

      case 'get_database_info':
        result = {
          totalTables: 237,
          keyTables: [
            "profiles - بيانات المستخدمين",
            "merchants - التجار",
            "affiliate_stores - متاجر المسوقين",
            "products - المنتجات",
            "orders - الطلبات",
            "alliances - التحالفات",
            "chat_rooms - غرف الشات",
            "brain_memory - ذاكرة عقل المشروع"
          ],
          securityNote: "جميع الجداول محمية بـ RLS policies"
        };
        break;

      default:
        result = { error: "Unknown action" };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Brain code reader error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function analyzeCodeQuery(query: string): any {
  const queryLower = query?.toLowerCase() || '';
  
  // Pattern matching for common queries
  if (queryLower.includes('auth') || queryLower.includes('تسجيل')) {
    return {
      found: true,
      location: "src/contexts/AuthContext.tsx, src/pages/Login.tsx",
      description: "نظام المصادقة يستخدم Supabase Auth مع Firebase Phone Auth للـ OTP",
      relatedFiles: ["src/hooks/useAuth.ts", "supabase/functions/send-otp"]
    };
  }
  
  if (queryLower.includes('payment') || queryLower.includes('دفع') || queryLower.includes('geidea')) {
    return {
      found: true,
      location: "src/components/checkout/, supabase/functions/geidea-*",
      description: "نظام الدفع يستخدم Geidea مع callback ديناميكي",
      relatedFiles: ["GeideaPaymentButton.tsx", "geidea-initiate-payment", "geidea-payment-callback"]
    };
  }
  
  if (queryLower.includes('chat') || queryLower.includes('شات')) {
    return {
      found: true,
      location: "src/pages/AtlantisChatRooms.tsx, src/components/chat/",
      description: "نظامين: FloatingAIChat للمسوقين، UnifiedChatWidget لخدمة العملاء",
      relatedFiles: ["useAtlantisChat.ts", "chat-assistant edge function"]
    };
  }
  
  if (queryLower.includes('atlantis') || queryLower.includes('game') || queryLower.includes('لعب')) {
    return {
      found: true,
      location: "src/features/atlantis-world/, src/pages/AtlantisWorld.tsx",
      description: "نظام ألعاب استراتيجية مع خريطة 3D، قوات، موارد، ومعارك",
      relatedFiles: ["World3DMap.tsx", "GameUI.tsx", "TroopMovement.tsx"]
    };
  }

  if (queryLower.includes('design') || queryLower.includes('theme') || queryLower.includes('تصميم')) {
    return {
      found: true,
      location: "src/index.css, tailwind.config.ts, src/themes/",
      description: "نظام تصميم Anaqati: ماروني #5A2647، وردي #F4C2C2، ذهبي #C89B3C",
      relatedFiles: ["src/themes/anaqati/tokens.css", "src/components/ui/"]
    };
  }

  return {
    found: false,
    suggestion: "جرب البحث عن: auth, payment, chat, atlantis, design, database"
  };
}
