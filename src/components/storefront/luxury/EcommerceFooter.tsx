import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, CreditCard, Truck, ShieldCheck, RefreshCw, Instagram, Twitter, Facebook } from 'lucide-react';
import { useLuxuryTheme } from './LuxuryThemeContext';

interface FooterSettings {
  footer_phone?: string | null;
  footer_address?: string | null;
  footer_description?: string | null;
  store_email?: string | null;
  whatsapp_number?: string | null;
  social_links?: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    snapchat?: string;
  } | null;
}

interface EcommerceFooterProps {
  storeName: string;
  logoUrl?: string;
  settings?: FooterSettings | null;
}

const features = [
  { icon: Truck, label: 'شحن مجاني', desc: 'للطلبات فوق 500 ر.س' },
  { icon: RefreshCw, label: 'إرجاع مجاني', desc: 'خلال 14 يوم' },
  { icon: ShieldCheck, label: 'ضمان الجودة', desc: '100% أصلي' },
  { icon: CreditCard, label: 'دفع آمن', desc: 'بطاقات ومدى' },
];

const defaultFooterLinks = {
  shop: [
    { label: 'جديد الوصول', href: '#' },
    { label: 'الأكثر مبيعاً', href: '#' },
    { label: 'تخفيضات', href: '#' },
    { label: 'كل المنتجات', href: '#' },
  ],
  categories: [
    { label: 'فساتين سهرة', href: '#' },
    { label: 'عبايات', href: '#' },
    { label: 'فساتين زفاف', href: '#' },
    { label: 'إكسسوارات', href: '#' },
  ],
  support: [
    { label: 'تتبع الطلب', href: '#' },
    { label: 'سياسة الإرجاع', href: '#' },
    { label: 'الشحن والتوصيل', href: '#' },
    { label: 'الأسئلة الشائعة', href: '#' },
  ],
  about: [
    { label: 'قصتنا', href: '#' },
    { label: 'المتاجر', href: '#' },
    { label: 'وظائف', href: '#' },
    { label: 'تواصلي معنا', href: '#' },
  ],
};

export const EcommerceFooter: React.FC<EcommerceFooterProps> = ({
  storeName,
  logoUrl,
  settings,
}) => {
  const { colors, isDark } = useLuxuryTheme();

  // استخدام البيانات من الإعدادات أو القيم الافتراضية
  const phone = settings?.footer_phone || '920012345';
  const email = settings?.store_email || 'info@store.com';
  const address = settings?.footer_address || 'الرياض، المملكة العربية السعودية';
  const description = settings?.footer_description || 'متجر أزياء فاخرة يقدم أرقى التصاميم الشرقية والعصرية للمرأة الأنيقة.';
  const socialLinks = settings?.social_links;
  const footerLinks = defaultFooterLinks;

  return (
    <footer
      className="transition-colors duration-500"
      style={{
        background: colors.footerBg,
        borderTop: `1px solid ${colors.border}`,
        color: colors.text,
      }}
    >
      {/* Features Bar */}
      <div 
        className="py-8 md:py-10 transition-colors duration-500"
        style={{
          background: colors.footerFeaturesBg,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div 
                  className="p-3 rounded-xl transition-colors duration-500"
                  style={{
                    background: colors.accentMuted,
                  }}
                >
                  <feature.icon className="w-5 h-5" style={{ color: colors.accent }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.text }}>{feature.label}</p>
                  <p className="text-xs" style={{ color: colors.textMuted }}>{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 md:gap-10">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              {logoUrl && (
                <img 
                  src={logoUrl} 
                  alt={storeName}
                  className="w-12 h-12 rounded-full object-cover"
                  style={{ border: `2px solid ${isDark ? 'hsla(38, 70%, 50%, 0.3)' : 'hsla(20, 70%, 40%, 0.3)'}` }}
                />
              )}
              <h3 
                className="text-2xl"
                style={{ fontFamily: "'Playfair Display', serif", color: colors.text }}
              >
                {storeName}
              </h3>
            </div>
            <p className="text-sm mb-6 max-w-xs leading-relaxed" style={{ color: colors.textMuted }}>
              {description}
            </p>

            {/* Contact */}
            <div className="space-y-3">
              <a 
                href={`tel:${phone}`} 
                className="flex items-center gap-3 text-sm transition-opacity hover:opacity-100"
                style={{ color: colors.textSecondary }}
              >
                <Phone className="w-4 h-4" style={{ color: colors.accent }} />
                {phone}
              </a>
              <a 
                href={`mailto:${email}`} 
                className="flex items-center gap-3 text-sm transition-opacity hover:opacity-100"
                style={{ color: colors.textSecondary }}
              >
                <Mail className="w-4 h-4" style={{ color: colors.accent }} />
                {email}
              </a>
              <p className="flex items-center gap-3 text-sm" style={{ color: colors.textSecondary }}>
                <MapPin className="w-4 h-4" style={{ color: colors.accent }} />
                {address}
              </p>
            </div>

            {/* Social */}
            <div className="flex items-center gap-3 mt-6">
              {socialLinks?.instagram && (
                <motion.a
                  href={`https://instagram.com/${socialLinks.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-full transition-colors duration-300"
                  style={{
                    background: colors.accentMuted,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                  }}
                  whileHover={{ 
                    scale: 1.1, 
                    borderColor: colors.borderHover,
                  }}
                >
                  <Instagram className="w-4 h-4" />
                </motion.a>
              )}
              {socialLinks?.twitter && (
                <motion.a
                  href={`https://twitter.com/${socialLinks.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-full transition-colors duration-300"
                  style={{
                    background: colors.accentMuted,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                  }}
                  whileHover={{ 
                    scale: 1.1, 
                    borderColor: colors.borderHover,
                  }}
                >
                  <Twitter className="w-4 h-4" />
                </motion.a>
              )}
              {!socialLinks?.instagram && !socialLinks?.twitter && (
                // عرض أيقونات افتراضية إذا لم تكن هناك روابط
                [Instagram, Twitter, Facebook].map((Icon, i) => (
                  <motion.a
                    key={i}
                    href="#"
                    className="p-2.5 rounded-full transition-colors duration-300"
                    style={{
                      background: colors.accentMuted,
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                    }}
                    whileHover={{ 
                      scale: 1.1, 
                      borderColor: colors.borderHover,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </motion.a>
                ))
              )}
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="text-sm font-medium mb-4" style={{ color: colors.accent }}>
              تسوقي
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.shop.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="text-sm transition-opacity hover:opacity-100"
                    style={{ color: colors.textMuted }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-4" style={{ color: colors.accent }}>
              الفئات
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.categories.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="text-sm transition-opacity hover:opacity-100"
                    style={{ color: colors.textMuted }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-4" style={{ color: colors.accent }}>
              مساعدة
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="text-sm transition-opacity hover:opacity-100"
                    style={{ color: colors.textMuted }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-4" style={{ color: colors.accent }}>
              عنّا
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.about.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="text-sm transition-opacity hover:opacity-100"
                    style={{ color: colors.textMuted }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div 
        className="py-6 transition-colors duration-500"
        style={{
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs" style={{ color: colors.textMuted }}>
              © 2024 {storeName}. جميع الحقوق محفوظة.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs transition-opacity hover:opacity-100" style={{ color: colors.textMuted }}>
                سياسة الخصوصية
              </a>
              <a href="#" className="text-xs transition-opacity hover:opacity-100" style={{ color: colors.textMuted }}>
                الشروط والأحكام
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
