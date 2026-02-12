import { Button } from '@/components/ui/button';

interface GeideaPaymentProps {
  amount: number;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const GeideaPayment: React.FC<GeideaPaymentProps> = ({ amount, onSuccess, onError }) => {
  // Placeholder - implement Geidea payment integration
  return (
    <Button onClick={() => onSuccess?.()}>
      دفع عبر Geidea
    </Button>
  );
};
