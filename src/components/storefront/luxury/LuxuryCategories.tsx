import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

export interface Category {
  id: string;
  name: string;
  image: string;
  productCount: number;
  description?: string;
}

interface LuxuryCategoriesProps {
  categories: Category[];
  onCategoryClick: (id: string) => void;
}

export function LuxuryCategories({
  categories,
  onCategoryClick,
}: LuxuryCategoriesProps) {
  return (
    <div className="min-h-screen bg-background py-12" dir="rtl">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            تصفح التصنيفات
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            اكتشف مجموعتنا الفاخرة من التصنيفات المتنوعة
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onCategoryClick(category.id)}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer"
            >
              {/* Background Image */}
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              
              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <h2 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {category.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {category.productCount} منتج
                  </span>
                  <div className="flex items-center gap-2 text-primary group-hover:gap-3 transition-all">
                    <span className="text-sm font-medium">استكشف</span>
                    <ChevronLeft className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Decorative Border */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/30 rounded-2xl transition-colors" />
            </motion.div>
          ))}
        </div>

        {/* Featured Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-8 md:p-12 border border-primary/20"
        >
          <div className="relative z-10 max-w-xl">
            <span className="text-primary text-sm font-medium mb-2 block">
              تشكيلة جديدة
            </span>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              اكتشف أحدث المنتجات
            </h3>
            <p className="text-muted-foreground mb-6">
              تصاميم حصرية بجودة عالية تناسب جميع الأذواق
            </p>
            <button className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors">
              تسوق الآن
            </button>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl" />
        </motion.div>
      </div>
    </div>
  );
}
