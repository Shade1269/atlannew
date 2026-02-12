-- نظام الحماية المالية وكشف الاحتيال
-- إنشاء جداول الأمان والحماية

-- جدول قوانين كشف الاحتيال
CREATE TABLE public.fraud_detection_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('VELOCITY', 'AMOUNT', 'LOCATION', 'PATTERN', 'BLACKLIST')),
  conditions JSONB NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('BLOCK', 'REVIEW', 'ALERT', 'REQUIRE_VERIFICATION')),
  severity TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول حالات الاحتيال المكتشفة
CREATE TABLE public.fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID,
  order_id UUID,
  user_id UUID,
  rule_id UUID REFERENCES public.fraud_detection_rules(id),
  alert_type TEXT NOT NULL,
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWING', 'CONFIRMED', 'FALSE_POSITIVE', 'RESOLVED')),
  metadata JSONB DEFAULT '{}',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول المعاملات الآمنة
CREATE TABLE public.secure_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  encrypted_data BYTEA NOT NULL,
  encryption_key_id TEXT NOT NULL,
  hash_signature TEXT NOT NULL,
  pci_compliance_level TEXT NOT NULL DEFAULT 'LEVEL_1',
  security_tokens JSONB DEFAULT '{}',
  audit_trail JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

-- جدول النسخ الاحتياطية
CREATE TABLE public.backup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type TEXT NOT NULL CHECK (backup_type IN ('FULL', 'INCREMENTAL', 'DIFFERENTIAL')),
  backup_scope TEXT NOT NULL CHECK (backup_scope IN ('DATABASE', 'TRANSACTIONS', 'USER_DATA', 'SYSTEM_CONFIG')),
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  checksum TEXT NOT NULL,
  encryption_status TEXT NOT NULL DEFAULT 'ENCRYPTED',
  backup_status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (backup_status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED', 'VERIFIED')),
  error_message TEXT,
  retention_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- جدول سجل الأمان والامتثال
CREATE TABLE public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('LOGIN', 'TRANSACTION', 'DATA_ACCESS', 'SECURITY_BREACH', 'POLICY_VIOLATION', 'SYSTEM_ACCESS')),
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  resource_accessed TEXT,
  action_performed TEXT NOT NULL,
  risk_assessment TEXT DEFAULT 'LOW' CHECK (risk_assessment IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  compliance_flags JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول إعدادات الأمان
CREATE TABLE public.security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID,
  setting_name TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('FRAUD_DETECTION', 'ENCRYPTION', 'BACKUP', 'PCI_COMPLIANCE', 'ACCESS_CONTROL')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_id, setting_name)
);

-- تفعيل RLS على جميع الجداول
ALTER TABLE public.fraud_detection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secure_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

-- سياسات الحماية للمشرفين فقط
CREATE POLICY "Admin access to fraud rules" ON public.fraud_detection_rules
FOR ALL USING (get_current_user_role() = 'admin');

CREATE POLICY "Admin access to fraud alerts" ON public.fraud_alerts
FOR ALL USING (get_current_user_role() = 'admin');

CREATE POLICY "Admin access to secure transactions" ON public.secure_transactions
FOR ALL USING (get_current_user_role() = 'admin');

CREATE POLICY "Admin access to backup logs" ON public.backup_logs
FOR ALL USING (get_current_user_role() = 'admin');

CREATE POLICY "Admin access to security audit" ON public.security_audit_log
FOR ALL USING (get_current_user_role() = 'admin');

-- سياسة خاصة لإعدادات الأمان - أصحاب المتاجر يمكنهم إدارة إعدادات متاجرهم
CREATE POLICY "Shop owners can manage security settings" ON public.security_settings
FOR ALL USING (
  shop_id IN (
    SELECT s.id FROM shops s 
    JOIN profiles p ON p.id = s.owner_id 
    WHERE p.auth_user_id = auth.uid()
  ) OR get_current_user_role() = 'admin'
);

-- فهارس للأداء
CREATE INDEX idx_fraud_alerts_risk_score ON public.fraud_alerts(risk_score DESC);
CREATE INDEX idx_fraud_alerts_status ON public.fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_created_at ON public.fraud_alerts(created_at DESC);
CREATE INDEX idx_secure_transactions_order_id ON public.secure_transactions(order_id);
CREATE INDEX idx_security_audit_log_event_type ON public.security_audit_log(event_type);
CREATE INDEX idx_security_audit_log_created_at ON public.security_audit_log(created_at DESC);
CREATE INDEX idx_backup_logs_backup_type ON public.backup_logs(backup_type);
CREATE INDEX idx_backup_logs_created_at ON public.backup_logs(created_at DESC);

-- دوال مساعدة للأمان
CREATE OR REPLACE FUNCTION public.calculate_risk_score(
  user_data JSONB,
  transaction_data JSONB,
  historical_data JSONB DEFAULT '{}'
) RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  base_score INTEGER := 0;
  velocity_score INTEGER := 0;
  amount_score INTEGER := 0;
  location_score INTEGER := 0;
  final_score INTEGER;
BEGIN
  -- حساب نقاط المخاطر الأساسية
  -- سرعة المعاملات (عدد المعاملات في آخر ساعة)
  IF (historical_data->>'transactions_last_hour')::INTEGER > 10 THEN
    velocity_score := 30;
  ELSIF (historical_data->>'transactions_last_hour')::INTEGER > 5 THEN
    velocity_score := 15;
  END IF;
  
  -- مبلغ المعاملة
  IF (transaction_data->>'amount')::NUMERIC > 10000 THEN
    amount_score := 25;
  ELSIF (transaction_data->>'amount')::NUMERIC > 5000 THEN
    amount_score := 10;
  END IF;
  
  -- الموقع الجغرافي المشبوه
  IF (user_data->>'suspicious_location')::BOOLEAN = true THEN
    location_score := 20;
  END IF;
  
  -- عميل جديد
  IF (user_data->>'is_new_customer')::BOOLEAN = true THEN
    base_score := base_score + 10;
  END IF;
  
  -- معاملة دولية
  IF (transaction_data->>'is_international')::BOOLEAN = true THEN
    base_score := base_score + 15;
  END IF;
  
  final_score := base_score + velocity_score + amount_score + location_score;
  
  -- التأكد من أن النتيجة ضمن النطاق المسموح
  RETURN LEAST(100, GREATEST(0, final_score));
END;
$$;

-- دالة تشفير البيانات الحساسة
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(
  data_to_encrypt JSONB,
  encryption_level TEXT DEFAULT 'AES256'
) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  encrypted_result TEXT;
  key_id TEXT;
BEGIN
  -- توليد معرف فريد للمفتاح
  key_id := 'key_' || gen_random_uuid()::TEXT;
  
  -- في بيئة الإنتاج، سيتم استخدام مكتبة تشفير حقيقية
  -- هنا نستخدم ترميز base64 كمثال (لأغراض التطوير فقط)
  encrypted_result := encode(convert_to(data_to_encrypt::TEXT, 'UTF8'), 'base64');
  
  RETURN encrypted_result;
END;
$$;

-- دالة تسجيل الأحداث الأمنية
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type TEXT,
  user_id UUID DEFAULT NULL,
  resource_accessed TEXT DEFAULT NULL,
  action_performed TEXT DEFAULT '',
  risk_level TEXT DEFAULT 'LOW',
  additional_metadata JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.security_audit_log (
    event_type,
    user_id,
    resource_accessed,
    action_performed,
    risk_assessment,
    metadata
  ) VALUES (
    event_type,
    user_id,
    resource_accessed,
    action_performed,
    risk_level,
    additional_metadata
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- إدراج قوانين كشف الاحتيال الأساسية
INSERT INTO public.fraud_detection_rules (rule_name, rule_type, conditions, action, severity) VALUES
('High Amount Transaction', 'AMOUNT', '{"max_amount": 20000, "currency": "SAR"}', 'REVIEW', 'HIGH'),
('Velocity Check - Hourly', 'VELOCITY', '{"max_transactions": 10, "time_window": "1 hour"}', 'ALERT', 'MEDIUM'),
('Velocity Check - Daily', 'VELOCITY', '{"max_transactions": 50, "time_window": "24 hours"}', 'REVIEW', 'HIGH'),
('New Customer High Value', 'PATTERN', '{"is_new_customer": true, "min_amount": 5000}', 'REQUIRE_VERIFICATION', 'MEDIUM'),
('International Transaction', 'LOCATION', '{"is_international": true, "min_amount": 1000}', 'ALERT', 'LOW'),
('Suspicious IP Range', 'BLACKLIST', '{"blacklisted_ips": [], "action_on_match": "immediate_block"}', 'BLOCK', 'CRITICAL');

-- إدراج إعدادات الأمان الافتراضية
INSERT INTO public.security_settings (setting_name, setting_value, category) VALUES
('fraud_detection_enabled', '{"enabled": true, "threshold": 70}', 'FRAUD_DETECTION'),
('encryption_algorithm', '{"algorithm": "AES256", "key_rotation_days": 90}', 'ENCRYPTION'),
('backup_schedule', '{"frequency": "daily", "retention_days": 30, "encryption": true}', 'BACKUP'),
('pci_compliance_level', '{"level": "LEVEL_1", "audit_frequency": "quarterly"}', 'PCI_COMPLIANCE'),
('access_control', '{"mfa_required": true, "session_timeout": 1800, "max_login_attempts": 3}', 'ACCESS_CONTROL');

-- تريجر لتحديث التوقيت
CREATE OR REPLACE FUNCTION public.update_security_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_fraud_rules_timestamp
  BEFORE UPDATE ON public.fraud_detection_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_security_timestamp();

CREATE TRIGGER update_security_settings_timestamp
  BEFORE UPDATE ON public.security_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_security_timestamp();