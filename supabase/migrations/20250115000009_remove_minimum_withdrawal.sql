-- ============================================================================
-- إزالة الحد الأدنى للسحب
-- ============================================================================

-- إسقاط constraint الحد الأدنى للسحب
ALTER TABLE public.withdrawal_requests
DROP CONSTRAINT IF EXISTS min_withdrawal_amount;

-- إضافة تعليق توضيحي
COMMENT ON COLUMN public.withdrawal_requests.amount_sar IS 
'مبلغ السحب - لا يوجد حد أدنى';
