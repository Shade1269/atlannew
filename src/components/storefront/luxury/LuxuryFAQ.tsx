import { useState } from "react";
import { ChevronDown, Search, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useLuxuryTheme } from './LuxuryThemeContext';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface LuxuryFAQProps {
  faqs: FAQItem[];
  categories: string[];
  onContactSupport: () => void;
}

export function LuxuryFAQ({ faqs, categories, onContactSupport }: LuxuryFAQProps) {
  const { colors } = useLuxuryTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openItems, setOpenItems] = useState<string[]>([]);

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen py-12" dir="rtl" style={{ background: colors.background, color: colors.text }}>
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            الأسئلة الشائعة
          </h1>
          <p style={{ color: colors.textMuted }} className="max-w-2xl mx-auto">
            إجابات على أكثر الأسئلة شيوعاً. لم تجد إجابتك؟ تواصل معنا
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative max-w-2xl mx-auto mb-8"
        >
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.textMuted }} />
          <Input
            type="text"
            placeholder="ابحث في الأسئلة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-12 py-6 text-lg"
            style={{ 
              background: colors.backgroundSecondary, 
              border: `1px solid ${colors.border}`,
              color: colors.text,
            }}
          />
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-10"
        >
          <button
            onClick={() => setSelectedCategory(null)}
            className="px-5 py-2 rounded-full text-sm transition-colors"
            style={{
              background: !selectedCategory ? colors.primary : colors.backgroundSecondary,
              color: !selectedCategory ? colors.primaryText : colors.textMuted,
              border: `1px solid ${!selectedCategory ? colors.primary : colors.border}`,
            }}
          >
            الكل
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className="px-5 py-2 rounded-full text-sm transition-colors"
              style={{
                background: selectedCategory === category ? colors.primary : colors.backgroundSecondary,
                color: selectedCategory === category ? colors.primaryText : colors.textMuted,
                border: `1px solid ${selectedCategory === category ? colors.primary : colors.border}`,
              }}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4 mb-12">
          {filteredFaqs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p style={{ color: colors.textMuted }}>لا توجد نتائج مطابقة</p>
            </motion.div>
          ) : (
            filteredFaqs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="rounded-xl overflow-hidden"
                style={{ 
                  background: colors.backgroundSecondary, 
                  border: `1px solid ${colors.border}`,
                }}
              >
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full flex items-center justify-between p-5 text-right transition-colors"
                >
                  <span className="font-medium pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 transition-transform`}
                    style={{ 
                      color: colors.primary,
                      transform: openItems.includes(faq.id) ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>
                <AnimatePresence>
                  {openItems.includes(faq.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div 
                        className="p-5 pt-0"
                        style={{ borderTop: `1px solid ${colors.border}` }}
                      >
                        <p className="leading-relaxed" style={{ color: colors.textSecondary }}>
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-8 text-center"
          style={{ 
            background: colors.accentMuted,
            border: `1px solid ${colors.borderHover}`,
          }}
        >
          <MessageCircle className="w-12 h-12 mx-auto mb-4" style={{ color: colors.primary }} />
          <h2 className="text-xl font-semibold mb-2">
            لم تجد إجابتك؟
          </h2>
          <p className="mb-6" style={{ color: colors.textMuted }}>
            فريق الدعم جاهز للإجابة على جميع استفساراتك
          </p>
          <button
            onClick={onContactSupport}
            className="px-8 py-3 rounded-full font-medium transition-colors"
            style={{ background: colors.buttonPrimary, color: colors.buttonText }}
          >
            تواصل معنا
          </button>
        </motion.div>
      </div>
    </div>
  );
}
