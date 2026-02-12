import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useLuxuryTheme } from './LuxuryThemeContext';

export interface ContactInfo {
  email: string;
  phone: string;
  whatsapp?: string;
  address: string;
  workingHours: string;
}

interface LuxuryContactUsProps {
  contactInfo: ContactInfo;
  onSubmit: (data: { name: string; email: string; subject: string; message: string }) => void;
}

export function LuxuryContactUs({ contactInfo, onSubmit }: LuxuryContactUsProps) {
  const { colors } = useLuxuryTheme();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit(formData);
    setIsSubmitting(false);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const contactCards = [
    {
      icon: Mail,
      title: "البريد الإلكتروني",
      value: contactInfo.email,
      action: `mailto:${contactInfo.email}`,
    },
    {
      icon: Phone,
      title: "رقم الهاتف",
      value: contactInfo.phone,
      action: `tel:${contactInfo.phone}`,
    },
    {
      icon: MessageSquare,
      title: "واتساب",
      value: contactInfo.whatsapp || contactInfo.phone,
      action: `https://wa.me/${(contactInfo.whatsapp || contactInfo.phone).replace(/\D/g, "")}`,
    },
    {
      icon: Clock,
      title: "ساعات العمل",
      value: contactInfo.workingHours,
    },
  ];

  return (
    <div className="min-h-screen py-12" dir="rtl" style={{ background: colors.background, color: colors.text }}>
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            تواصل معنا
          </h1>
          <p className="max-w-2xl mx-auto" style={{ color: colors.textMuted }}>
            نسعد بتواصلك معنا. فريقنا جاهز للإجابة على جميع استفساراتك
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 space-y-4"
          >
            {contactCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                {card.action ? (
                  <a
                    href={card.action}
                    target={card.action.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="block rounded-xl p-5 transition-colors group"
                    style={{ 
                      background: colors.backgroundSecondary, 
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{ background: colors.accentMuted }}
                      >
                        <card.icon className="w-6 h-6" style={{ color: colors.primary }} />
                      </div>
                      <div>
                        <p className="text-sm mb-1" style={{ color: colors.textMuted }}>{card.title}</p>
                        <p className="font-medium">{card.value}</p>
                      </div>
                    </div>
                  </a>
                ) : (
                  <div 
                    className="rounded-xl p-5"
                    style={{ 
                      background: colors.backgroundSecondary, 
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: colors.accentMuted }}
                      >
                        <card.icon className="w-6 h-6" style={{ color: colors.primary }} />
                      </div>
                      <div>
                        <p className="text-sm mb-1" style={{ color: colors.textMuted }}>{card.title}</p>
                        <p className="font-medium">{card.value}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {/* Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-xl p-5"
              style={{ 
                background: colors.backgroundSecondary, 
                border: `1px solid ${colors.border}`,
              }}
            >
              <div className="flex items-start gap-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: colors.accentMuted }}
                >
                  <MapPin className="w-6 h-6" style={{ color: colors.primary }} />
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: colors.textMuted }}>العنوان</p>
                  <p className="font-medium">{contactInfo.address}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div 
              className="rounded-2xl p-6 md:p-8"
              style={{ 
                background: colors.backgroundSecondary, 
                border: `1px solid ${colors.border}`,
              }}
            >
              <h2 className="text-xl font-semibold mb-6">
                أرسل رسالة
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      الاسم
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="اسمك الكامل"
                      required
                      style={{ 
                        background: colors.background,
                        border: `1px solid ${colors.border}`,
                        color: colors.text,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      البريد الإلكتروني
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                      required
                      style={{ 
                        background: colors.background,
                        border: `1px solid ${colors.border}`,
                        color: colors.text,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    الموضوع
                  </label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="موضوع الرسالة"
                    required
                    style={{ 
                      background: colors.background,
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    الرسالة
                  </label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="اكتب رسالتك هنا..."
                    required
                    rows={6}
                    className="resize-none"
                    style={{ 
                      background: colors.background,
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                    }}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-6 text-lg gap-2"
                  style={{ background: colors.buttonPrimary, color: colors.buttonText }}
                >
                  {isSubmitting ? (
                    "جاري الإرسال..."
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      إرسال الرسالة
                    </>
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
