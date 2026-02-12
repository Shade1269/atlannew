import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Store, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram,
  Heart,
  Shield,
  Truck,
  CreditCard,
  HeadphonesIcon,
  MessageCircle
} from 'lucide-react';

export const HomeFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="bg-muted/30 border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{t('platformName')}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('platformFullDescription')}
            </p>
            <div className="flex items-center gap-3">
              <a 
                href="#" 
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                aria-label="فيسبوك"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                aria-label="تويتر"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                aria-label="إنستغرام"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">{t('quickLinks')}</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/store" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('stores')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/atlantis/chat" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t('chat')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/leaderboard" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('leaderboard')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">{t('ourServices')}</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-4 w-4 text-primary" />
                <span>{t('freeShippingOver200')}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-primary" />
                <span>{t('qualityGuarantee')}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4 text-primary" />
                <span>{t('securePayment')}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <HeadphonesIcon className="h-4 w-4 text-primary" />
                <span>{t('support24h')}</span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">{t('contactUs')}</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <span>+966 XX XXX XXXX</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>info@anaqati.com</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>المملكة العربية السعودية</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-border" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            © {currentYear} {t('platformName')}. {t('allRightsReserved')}.
          </p>
          <div className="flex items-center gap-6">
            <Link 
              to="/privacy" 
              className="hover:text-primary transition-colors"
            >
              {t('privacyPolicy')}
            </Link>
            <Link 
              to="/terms" 
              className="hover:text-primary transition-colors"
            >
              {t('termsOfService')}
            </Link>
            <Link 
              to="/return-policy" 
              className="hover:text-primary transition-colors"
            >
              {t('returnPolicy')}
            </Link>
          </div>
          <p className="flex items-center gap-2">
            {t('madeWithLove')} <Heart className="h-4 w-4 text-destructive fill-current" /> {t('inSaudiArabia')}
          </p>
        </div>
      </div>
    </footer>
  );
};

