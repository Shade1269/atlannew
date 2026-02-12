-- جدول ذاكرة العقل لتخزين الأحداث والقرارات
CREATE TABLE IF NOT EXISTS public.brain_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  importance_score INTEGER DEFAULT 5 CHECK (importance_score BETWEEN 1 AND 10),
  context JSONB DEFAULT '{}',
  related_entities JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  recalled_count INTEGER DEFAULT 0,
  last_recalled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول الأنماط المكتشفة
CREATE TABLE IF NOT EXISTS public.brain_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_type TEXT NOT NULL,
  pattern_name TEXT NOT NULL,
  description TEXT,
  detection_rules JSONB NOT NULL,
  confidence_score NUMERIC(4,2) DEFAULT 0.5 CHECK (confidence_score BETWEEN 0 AND 1),
  occurrences INTEGER DEFAULT 1,
  last_detected_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول الإجراءات التلقائية
CREATE TABLE IF NOT EXISTS public.brain_auto_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_name TEXT NOT NULL,
  trigger_condition JSONB NOT NULL,
  action_type TEXT NOT NULL,
  action_payload JSONB NOT NULL,
  requires_approval BOOLEAN DEFAULT false,
  last_executed_at TIMESTAMPTZ,
  execution_count INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول سياق المحادثة
CREATE TABLE IF NOT EXISTS public.brain_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  messages JSONB NOT NULL DEFAULT '[]',
  context_summary TEXT,
  mood TEXT DEFAULT 'neutral',
  topics_discussed TEXT[] DEFAULT '{}',
  session_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.brain_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_auto_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_conversations ENABLE ROW LEVEL SECURITY;

-- استخدام دالة is_admin() الموجودة
CREATE POLICY "Admins can manage brain_memory"
ON public.brain_memory FOR ALL
USING (public.is_admin());

CREATE POLICY "Admins can manage brain_patterns"
ON public.brain_patterns FOR ALL
USING (public.is_admin());

CREATE POLICY "Admins can manage brain_auto_actions"
ON public.brain_auto_actions FOR ALL
USING (public.is_admin());

CREATE POLICY "Users can manage their brain conversations"
ON public.brain_conversations FOR ALL
USING (user_id = auth.uid() OR public.is_admin());

-- فهرسة للأداء
CREATE INDEX IF NOT EXISTS idx_brain_memory_type ON public.brain_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_brain_memory_importance ON public.brain_memory(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_brain_memory_created ON public.brain_memory(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brain_patterns_type ON public.brain_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_brain_conversations_user ON public.brain_conversations(user_id);