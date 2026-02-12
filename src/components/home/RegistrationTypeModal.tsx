import React from "react";
import { Store, TrendingUp, Check, AlertCircle } from "lucide-react";
import { UnifiedButton } from "@/components/design-system";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFastAuth } from "@/hooks/useFastAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface RegistrationTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSelectType: (type: "merchant" | "marketer") => void;
}

export const RegistrationTypeModal: React.FC<RegistrationTypeModalProps> = ({
  open,
  onClose,
  onSelectType,
}) => {
  const { profile } = useFastAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Check user roles - الأدوار المسجلة في قاعدة البيانات: 'admin', 'merchant', 'affiliate', 'customer', 'moderator'
  const isMerchant = profile?.role === "merchant";
  const isAffiliate = profile?.role === "affiliate";

  const handleTypeSelect = (type: "merchant" | "marketer") => {
    // Prevent merchants from registering as affiliates/marketers
    if (isMerchant && type === "marketer") {
      toast({
        title: t("notAllowed"),
        description: t("merchantsCannotRegisterAsMarketers"),
        variant: "destructive",
      });
      return;
    }

    // Prevent affiliates from registering as merchants
    if (isAffiliate && type === "merchant") {
      toast({
        title: t("notAllowed"),
        description: t("marketersCannotRegisterAsMerchants"),
        variant: "destructive",
      });
      return;
    }

    onSelectType(type);
  };
  const types = [
    {
      id: "merchant" as const,
      title: t("merchantTitle"),
      icon: Store,
      description: t("forMerchants"),
      features: [
        t("merchantModalFeatures1"),
        t("merchantModalFeatures2"),
        t("merchantModalFeatures3"),
        t("merchantModalFeatures4"),
        t("merchantModalFeatures5"),
      ],
      color: "primary",
    },
    {
      id: "marketer" as const,
      title: t("marketerTitle"),
      icon: TrendingUp,
      description: t("forMarketers"),
      features: [
        t("marketerModalFeatures1"),
        t("marketerModalFeatures2"),
        t("marketerModalFeatures3"),
        t("marketerModalFeatures4"),
        t("marketerModalFeatures5"),
      ],
      color: "secondary",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {t("chooseAccountType")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t("chooseAccountTypeDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-3xl mx-auto">
          {types.map((type) => {
            const Icon = type.icon;
            const isDisabled =
              (isMerchant && type.id === "marketer") ||
              (isAffiliate && type.id === "merchant");

            return (
              <div
                key={type.id}
                className={`relative border-2 rounded-xl p-6 transition-all group ${
                  isDisabled
                    ? "border-destructive/50 cursor-not-allowed opacity-60"
                    : "hover:border-primary cursor-pointer"
                }`}
                onClick={() => !isDisabled && handleTypeSelect(type.id)}
              >
                {isDisabled && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 text-destructive text-sm font-medium">
                    <AlertCircle className="w-4 h-4" />
                    <span>{t("notAvailable")}</span>
                  </div>
                )}
                {/* Icon */}
                <div
                  className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                    type.color === "primary"
                      ? "bg-primary/10 group-hover:bg-primary/20"
                      : type.color === "secondary"
                      ? "bg-secondary/10 group-hover:bg-secondary/20"
                      : "bg-muted group-hover:bg-muted/80"
                  }`}
                >
                  <Icon
                    className={`w-8 h-8 ${
                      type.color === "primary"
                        ? "text-primary"
                        : type.color === "secondary"
                        ? "text-secondary"
                        : "text-foreground"
                    }`}
                  />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {type.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4">
                  {type.description}
                </p>

                {/* Features */}
                <ul className="space-y-2">
                  {type.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Select Button */}
                <UnifiedButton
                  variant={type.color as any}
                  className="w-full mt-6"
                  disabled={isDisabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isDisabled) {
                      handleTypeSelect(type.id);
                    }
                  }}
                >
                  {isDisabled
                    ? t("notAvailable")
                    : type.id === "merchant"
                    ? t("chooseMerchant")
                    : t("chooseMarketer")}
                </UnifiedButton>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("cancel")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
