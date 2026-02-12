import { X, Ruler, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface SizeChartRow {
  size: string;
  chest?: string;
  waist?: string;
  hips?: string;
  length?: string;
  shoulders?: string;
  [key: string]: string | undefined;
}

export interface SizeGuideData {
  title: string;
  description?: string;
  measurementGuide: string[];
  sizeChart: SizeChartRow[];
  columns: Array<{ key: string; label: string }>;
}

interface LuxurySizeGuideProps {
  isOpen: boolean;
  onClose: () => void;
  data: SizeGuideData;
}

export function LuxurySizeGuide({ isOpen, onClose, data }: LuxurySizeGuideProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl md:max-h-[90vh] bg-card rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Ruler className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{data.title}</h2>
                  {data.description && (
                    <p className="text-sm text-muted-foreground">{data.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Measurement Guide */}
              <div className="mb-8">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  كيفية أخذ القياسات
                </h3>
                <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                  {data.measurementGuide.map((guide, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <p className="text-sm text-muted-foreground">{guide}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Size Chart */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">جدول المقاسات (سم)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="border-b border-border">
                        {data.columns.map((col) => (
                          <th
                            key={col.key}
                            className="py-3 px-4 text-sm font-semibold text-foreground text-right"
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.sizeChart.map((row, index) => (
                        <tr
                          key={row.size}
                          className={`border-b border-border/50 ${
                            index % 2 === 0 ? "bg-muted/20" : ""
                          }`}
                        >
                          {data.columns.map((col) => (
                            <td
                              key={col.key}
                              className={`py-3 px-4 text-sm ${
                                col.key === "size"
                                  ? "font-semibold text-primary"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {row[col.key] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tips */}
              <div className="mt-8 bg-primary/5 rounded-xl p-4 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">نصيحة:</strong> إذا كنت بين مقاسين، ننصحك باختيار المقاس الأكبر للحصول على راحة أفضل.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border">
              <button
                onClick={onClose}
                className="w-full bg-primary text-primary-foreground py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
              >
                فهمت
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
