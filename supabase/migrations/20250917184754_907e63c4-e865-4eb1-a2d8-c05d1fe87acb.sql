-- Phase 2.3: Advanced Marketing & Automation System

-- 1. Marketing Automation Campaigns
CREATE TABLE public.marketing_automation_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('email_sequence', 'abandoned_cart', 'post_purchase', 'welcome_series', 're_engagement', 'birthday_campaign')),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('event', 'time_based', 'behavioral', 'manual')),
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  target_audience_rules JSONB NOT NULL DEFAULT '{}',
  campaign_steps JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  store_id UUID,
  affiliate_store_id UUID,
  created_by UUID,
  stats JSONB DEFAULT '{"sent": 0, "opened": 0, "clicked": 0, "converted": 0}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Lead Management System
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT,
  full_name TEXT,
  company TEXT,
  lead_source TEXT NOT NULL CHECK (lead_source IN ('website', 'social_media', 'referral', 'advertising', 'manual', 'api')),
  lead_status TEXT NOT NULL DEFAULT 'new' CHECK (lead_status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  lead_score INTEGER DEFAULT 0,
  interest_level TEXT DEFAULT 'low' CHECK (interest_level IN ('low', 'medium', 'high')),
  custom_fields JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  assigned_to UUID,
  store_id UUID,
  affiliate_store_id UUID,
  conversion_date TIMESTAMP WITH TIME ZONE,
  conversion_value NUMERIC DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Lead Activities Tracking
CREATE TABLE public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('email_opened', 'email_clicked', 'page_visited', 'form_submitted', 'call_made', 'meeting_scheduled', 'note_added', 'status_changed')),
  activity_description TEXT NOT NULL,
  activity_data JSONB DEFAULT '{}',
  performed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Advanced Analytics Events
CREATE TABLE public.advanced_analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  user_id UUID,
  session_id TEXT,
  store_id UUID,
  affiliate_store_id UUID,
  event_data JSONB NOT NULL DEFAULT '{}',
  page_url TEXT,
  referrer_url TEXT,
  user_agent TEXT,
  ip_address INET,
  device_info JSONB DEFAULT '{}',
  geo_location JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Customer Journey Mapping
CREATE TABLE public.customer_journey_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  step_name TEXT NOT NULL,
  step_category TEXT NOT NULL CHECK (step_category IN ('awareness', 'consideration', 'purchase', 'retention', 'advocacy')),
  step_data JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  store_id UUID,
  affiliate_store_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Smart Notifications System
CREATE TABLE public.smart_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'sms', 'push', 'in_app', 'whatsapp')),
  recipient_id UUID NOT NULL,
  sender_id UUID,
  subject TEXT,
  content TEXT NOT NULL,
  template_id UUID,
  trigger_event TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  read_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  store_id UUID,
  affiliate_store_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Behavioral Triggers
CREATE TABLE public.behavioral_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_name TEXT NOT NULL,
  trigger_description TEXT,
  conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  store_id UUID,
  affiliate_store_id UUID,
  triggered_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Predictive Analytics
CREATE TABLE public.predictive_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('sales_forecast', 'customer_churn', 'product_demand', 'seasonal_trends', 'customer_lifetime_value')),
  insight_data JSONB NOT NULL DEFAULT '{}',
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
  prediction_period TEXT, -- 'next_week', 'next_month', 'next_quarter'
  store_id UUID,
  affiliate_store_id UUID,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE
);

-- Create Indexes for better performance
CREATE INDEX idx_marketing_campaigns_store ON marketing_automation_campaigns(store_id, affiliate_store_id);
CREATE INDEX idx_marketing_campaigns_active ON marketing_automation_campaigns(is_active);
CREATE INDEX idx_leads_status ON leads(lead_status);
CREATE INDEX idx_leads_score ON leads(lead_score DESC);
CREATE INDEX idx_leads_store ON leads(store_id, affiliate_store_id);
CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id);
CREATE INDEX idx_analytics_events_type ON advanced_analytics_events(event_type);
CREATE INDEX idx_analytics_events_store ON advanced_analytics_events(store_id, affiliate_store_id);
CREATE INDEX idx_customer_journey_customer ON customer_journey_steps(customer_id);
CREATE INDEX idx_smart_notifications_recipient ON smart_notifications(recipient_id);
CREATE INDEX idx_smart_notifications_status ON smart_notifications(delivery_status);
CREATE INDEX idx_behavioral_triggers_active ON behavioral_triggers(is_active);
CREATE INDEX idx_predictive_insights_type ON predictive_insights(insight_type);

-- Enable RLS on all tables
ALTER TABLE marketing_automation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE advanced_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_journey_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Marketing Automation Campaigns
CREATE POLICY "Store owners can manage marketing campaigns" ON marketing_automation_campaigns
  FOR ALL 
  USING (
    store_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = auth.uid()
    ) OR 
    affiliate_store_id IN (
      SELECT ast.id FROM affiliate_stores ast 
      JOIN profiles p ON p.id = ast.profile_id 
      WHERE p.auth_user_id = auth.uid()
    ) OR 
    get_current_user_role() = 'admin'
  );

-- RLS Policies for Leads
CREATE POLICY "Store owners can manage leads" ON leads
  FOR ALL 
  USING (
    store_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = auth.uid()
    ) OR 
    affiliate_store_id IN (
      SELECT ast.id FROM affiliate_stores ast 
      JOIN profiles p ON p.id = ast.profile_id 
      WHERE p.auth_user_id = auth.uid()
    ) OR 
    get_current_user_role() = 'admin'
  );

-- RLS Policies for Lead Activities
CREATE POLICY "Store owners can view lead activities" ON lead_activities
  FOR SELECT 
  USING (
    lead_id IN (
      SELECT l.id FROM leads l WHERE (
        l.store_id IN (
          SELECT s.id FROM shops s 
          JOIN profiles p ON p.id = s.owner_id 
          WHERE p.auth_user_id = auth.uid()
        ) OR 
        l.affiliate_store_id IN (
          SELECT ast.id FROM affiliate_stores ast 
          JOIN profiles p ON p.id = ast.profile_id 
          WHERE p.auth_user_id = auth.uid()
        )
      )
    ) OR 
    get_current_user_role() = 'admin'
  );

CREATE POLICY "Store owners can create lead activities" ON lead_activities
  FOR INSERT 
  WITH CHECK (
    lead_id IN (
      SELECT l.id FROM leads l WHERE (
        l.store_id IN (
          SELECT s.id FROM shops s 
          JOIN profiles p ON p.id = s.owner_id 
          WHERE p.auth_user_id = auth.uid()
        ) OR 
        l.affiliate_store_id IN (
          SELECT ast.id FROM affiliate_stores ast 
          JOIN profiles p ON p.id = ast.profile_id 
          WHERE p.auth_user_id = auth.uid()
        )
      )
    )
  );

-- RLS Policies for Analytics Events
CREATE POLICY "Public can create analytics events" ON advanced_analytics_events
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Store owners can view analytics events" ON advanced_analytics_events
  FOR SELECT 
  USING (
    store_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = auth.uid()
    ) OR 
    affiliate_store_id IN (
      SELECT ast.id FROM affiliate_stores ast 
      JOIN profiles p ON p.id = ast.profile_id 
      WHERE p.auth_user_id = auth.uid()
    ) OR 
    get_current_user_role() = 'admin'
  );

-- RLS Policies for Customer Journey
CREATE POLICY "Store owners can manage customer journey" ON customer_journey_steps
  FOR ALL 
  USING (
    store_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = auth.uid()
    ) OR 
    affiliate_store_id IN (
      SELECT ast.id FROM affiliate_stores ast 
      JOIN profiles p ON p.id = ast.profile_id 
      WHERE p.auth_user_id = auth.uid()
    ) OR 
    get_current_user_role() = 'admin'
  );

-- RLS Policies for Smart Notifications
CREATE POLICY "Users can view their notifications" ON smart_notifications
  FOR SELECT 
  USING (
    recipient_id = auth.uid() OR
    sender_id IN (
      SELECT p.auth_user_id FROM profiles p WHERE p.auth_user_id = auth.uid()
    ) OR
    get_current_user_role() = 'admin'
  );

CREATE POLICY "Store owners can send notifications" ON smart_notifications
  FOR INSERT 
  WITH CHECK (
    store_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = auth.uid()
    ) OR 
    affiliate_store_id IN (
      SELECT ast.id FROM affiliate_stores ast 
      JOIN profiles p ON p.id = ast.profile_id 
      WHERE p.auth_user_id = auth.uid()
    ) OR 
    get_current_user_role() = 'admin'
  );

-- RLS Policies for Behavioral Triggers
CREATE POLICY "Store owners can manage behavioral triggers" ON behavioral_triggers
  FOR ALL 
  USING (
    store_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = auth.uid()
    ) OR 
    affiliate_store_id IN (
      SELECT ast.id FROM affiliate_stores ast 
      JOIN profiles p ON p.id = ast.profile_id 
      WHERE p.auth_user_id = auth.uid()
    ) OR 
    get_current_user_role() = 'admin'
  );

-- RLS Policies for Predictive Insights
CREATE POLICY "Store owners can view predictive insights" ON predictive_insights
  FOR SELECT 
  USING (
    store_id IN (
      SELECT s.id FROM shops s 
      JOIN profiles p ON p.id = s.owner_id 
      WHERE p.auth_user_id = auth.uid()
    ) OR 
    affiliate_store_id IN (
      SELECT ast.id FROM affiliate_stores ast 
      JOIN profiles p ON p.id = ast.profile_id 
      WHERE p.auth_user_id = auth.uid()
    ) OR 
    get_current_user_role() = 'admin'
  );

-- Add triggers for updated_at
CREATE TRIGGER update_marketing_automation_campaigns_updated_at
  BEFORE UPDATE ON marketing_automation_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_behavioral_triggers_updated_at
  BEFORE UPDATE ON behavioral_triggers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();