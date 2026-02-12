import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ReturnRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderAmount: number;
}

export const ReturnRequestDialog: React.FC<ReturnRequestDialogProps> = ({ 
  open, 
  onOpenChange, 
  orderId, 
  orderAmount 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>طلب إرجاع</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>طلب إرجاع للطلب رقم: {orderId}</p>
          <p>المبلغ: {orderAmount} ر.س</p>
          <Button onClick={() => onOpenChange(false)}>إرسال الطلب</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
