import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface CustomerAuthProps {
  storeSlug?: string;
  onSuccess?: () => void;
}

export const CustomerAuth: React.FC<CustomerAuthProps> = ({ storeSlug, onSuccess }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>تسجيل الدخول</CardTitle>
        <CardDescription>سجل دخولك للمتابعة</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="phone">رقم الجوال</Label>
            <Input id="phone" type="tel" placeholder="05xxxxxxxx" />
          </div>
          <Button onClick={onSuccess} className="w-full">
            تسجيل الدخول
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
