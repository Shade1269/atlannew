-- Insert default channels if they don't exist
INSERT INTO public.channels (name, description, type, is_active) 
SELECT 'عام', 'غرفة الدردشة العامة', 'general', true
WHERE NOT EXISTS (SELECT 1 FROM public.channels WHERE name = 'عام');

INSERT INTO public.channels (name, description, type, is_active) 
SELECT 'التقنية', 'نقاش حول التقنية والبرمجة', 'general', true
WHERE NOT EXISTS (SELECT 1 FROM public.channels WHERE name = 'التقنية');

INSERT INTO public.channels (name, description, type, is_active) 
SELECT 'عشوائي', 'دردشة عامة عن مواضيع مختلفة', 'general', true
WHERE NOT EXISTS (SELECT 1 FROM public.channels WHERE name = 'عشوائي');

-- Enable realtime for messages and channels
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.channels REPLICA IDENTITY FULL;
ALTER TABLE public.channel_members REPLICA IDENTITY FULL;

-- Add tables to realtime publication
DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;
CREATE PUBLICATION supabase_realtime;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;  
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;