import { motion } from 'framer-motion';
import { Store, Phone, Mail, MapPin, Heart } from 'lucide-react';

interface AffiliateStore {
  id: string;
  store_name: string;
  bio: string;
  logo_url?: string;
}

interface ModernFooterProps {
  store: AffiliateStore;
}

export const ModernFooter = ({ store }: ModernFooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8" dir="rtl">
          {/* Store Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.store_name}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                  <Store className="h-6 w-6 text-primary" />
                </div>
              )}
              <h3 className="text-xl font-bold text-foreground">{store.store_name}</h3>
            </div>
            {store.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {store.bio}
              </p>
            )}
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <h4 className="text-lg font-semibold text-foreground">روابط سريعة</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#products" className="text-muted-foreground hover:text-primary transition-colors">
                  المنتجات
                </a>
              </li>
              <li>
                <a href="#categories" className="text-muted-foreground hover:text-primary transition-colors">
                  الفئات
                </a>
              </li>
              <li>
                <a href="#about" className="text-muted-foreground hover:text-primary transition-colors">
                  عن المتجر
                </a>
              </li>
              <li>
                <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">
                  اتصل بنا
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <h4 className="text-lg font-semibold text-foreground">تواصل معنا</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <span>+966 XX XXX XXXX</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>info@store.com</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>المملكة العربية السعودية</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-border" />

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground"
        >
          <p className="flex items-center gap-2">
            © {currentYear} {store.store_name}. جميع الحقوق محفوظة.
          </p>
          <p className="flex items-center gap-2">
            صنع بـ <Heart className="h-4 w-4 text-destructive fill-current" /> في السعودية
          </p>
        </motion.div>
      </div>
    </footer>
  );
};
