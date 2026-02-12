-- إسقاط الـ trigger الذي يسبب مشكلة إرسال الرسائل
DROP TRIGGER IF EXISTS chat_points_trigger ON public.chat_messages;

-- إسقاط الدالة المرتبطة
DROP FUNCTION IF EXISTS public.award_chat_points();