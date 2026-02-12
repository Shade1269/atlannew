import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Flame } from 'lucide-react';
import { useLuxuryTheme } from './LuxuryThemeContext';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownTimerProps {
  targetDate: Date;
  title?: string;
  subtitle?: string;
  onComplete?: () => void;
  variant?: 'default' | 'compact' | 'floating';
  showLabels?: boolean;
  /** محتوى يظهر داخل مربع العداد في الأعلى (مثل زر تسوق الآن) */
  topContent?: React.ReactNode;
  /** عند true (عروض الفلاش): بدون إطار حول العداد، والعنوان أبيض في النمط الليلي فقط */
  noFrame?: boolean;
  /** عند true: صناديق الأرقام بخلفية ثيم خفيفة (بدل لون صلب) — للمربع الرئيسي في النمط النهاري */
  lightDigitBoxes?: boolean;
}

const calculateTimeLeft = (targetDate: Date): TimeLeft | null => {
  const ts = targetDate.getTime();
  if (Number.isNaN(ts)) return null;
  const difference = ts - new Date().getTime();
  if (difference <= 0) return null;

  return {
    days: Math.max(0, Math.floor(difference / (1000 * 60 * 60 * 24))),
    hours: Math.max(0, Math.floor((difference / (1000 * 60 * 60)) % 24)),
    minutes: Math.max(0, Math.floor((difference / 1000 / 60) % 60)),
    seconds: Math.max(0, Math.floor((difference / 1000) % 60)),
  };
};

export function CountdownTimer({
  targetDate,
  title = 'العرض ينتهي خلال',
  subtitle,
  onComplete,
  variant = 'default',
  showLabels = true,
  topContent,
  noFrame = false,
  lightDigitBoxes = false,
}: CountdownTimerProps) {
  const { colors, isDark } = useLuxuryTheme();
  /** في الوضع الليلي نستخدم نصاً أوضح من textMuted للتباين على الخلفيات الداكنة */
  const labelColor = isDark ? colors.textSecondary : colors.textMuted;
  const safeTarget = targetDate && Number.isFinite(targetDate.getTime()) ? targetDate : new Date(Date.now() + 86400000);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => calculateTimeLeft(safeTarget));
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(safeTarget);
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft) {
        // Mark as urgent if less than 1 hour
        setIsUrgent(newTimeLeft.days === 0 && newTimeLeft.hours < 1);
      } else {
        clearInterval(timer);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [safeTarget.getTime(), onComplete]);

  if (!timeLeft) return null;

  /** ترتيب العرض: يوم ثم ساعة ثم دقيقة ثم ثانية (عكسي لـ RTL فيصل يوم لليسار وثانية لليمين) */
  const timeUnits = [
    { value: timeLeft.seconds, label: 'ثانية', key: 'seconds' },
    { value: timeLeft.minutes, label: 'دقيقة', key: 'minutes' },
    { value: timeLeft.hours, label: 'ساعة', key: 'hours' },
    { value: timeLeft.days, label: 'يوم', key: 'days' },
  ];

  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full transition-colors" dir="rtl"
        style={{
          background: isUrgent 
            ? 'linear-gradient(90deg, hsl(345, 70%, 45%), hsl(345, 70%, 55%))'
            : colors.buttonPrimary,
        }}
      >
        {isUrgent ? (
          <Flame className="w-4 h-4 animate-pulse text-white" />
        ) : (
          <Clock className="w-4 h-4" style={{ color: colors.primaryText }} />
        )}
        <span className="text-sm font-bold" style={{ color: isUrgent ? 'white' : colors.primaryText }}>
          {String(timeLeft.days).padStart(2, '0')}:
          {String(timeLeft.hours).padStart(2, '0')}:
          {String(timeLeft.minutes).padStart(2, '0')}:
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-6 right-6 z-50 rounded-2xl p-4 shadow-2xl transition-colors"
        style={{
          background: colors.backgroundCard,
          border: `2px solid ${isUrgent ? colors.error : colors.primary}`,
          backdropFilter: 'blur(20px)',
        }}
        dir="rtl"
      >
        <div className="flex items-center gap-3 mb-3">
          {isUrgent ? (
            <Flame className="w-5 h-5 animate-pulse" style={{ color: colors.error }} />
          ) : (
            <Clock className="w-5 h-5" style={{ color: colors.accent }} />
          )}
          <span className="text-sm font-medium" style={{ color: colors.text }}>
            {title}
          </span>
        </div>
        <div className="flex gap-2">
          {timeUnits.map((unit) => (
            <div key={unit.key} className="text-center min-w-[40px]">
              <motion.div
                key={`${unit.key}-${unit.value}`}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-xl font-bold rounded-lg px-2 py-1"
                style={{
                  background: isUrgent ? colors.error : colors.primary,
                  color: isUrgent ? 'white' : colors.primaryText,
                }}
              >
                {String(unit.value).padStart(2, '0')}
              </motion.div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Default variant (مع noFrame: بدون إطار، والعنوان أبيض في الليلي)
  const titleColor = noFrame && isDark ? '#ffffff' : (isUrgent ? colors.error : colors.accent);
  return (
    <div
      className="rounded-2xl p-6 md:p-8 transition-colors"
      style={{
        background: noFrame ? 'transparent' : (isUrgent ? colors.errorBg : colors.accentMuted),
        border: noFrame ? 'none' : `1px solid ${isUrgent ? colors.error : colors.borderAccent}`,
      }}
      dir="rtl"
    >
      {topContent && <div className="flex justify-center mb-4">{topContent}</div>}
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-2">
          {isUrgent ? (
            <Flame className="w-6 h-6 animate-pulse" style={{ color: colors.error }} />
          ) : (
            <Clock className="w-6 h-6" style={{ color: noFrame && isDark ? '#ffffff' : colors.accent }} />
          )}
          <h3
            className="text-xl md:text-2xl font-bold"
            style={{ color: titleColor }}
          >
            {title}
          </h3>
        </div>
        {subtitle && (
          <p className="text-sm" style={{ color: labelColor }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Timer — يستخدم العرض المتاح */}
      <div className="flex flex-wrap justify-center sm:justify-evenly gap-3 md:gap-4 w-full max-w-full">
        {timeUnits.map((unit, index) => (
          <div key={unit.key} className="flex items-center gap-3 md:gap-6">
            <div className="text-center">
              <motion.div
                key={`${unit.key}-${unit.value}`}
                initial={{ scale: 1.1, rotateX: -90 }}
                animate={{ scale: 1, rotateX: 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="relative w-14 h-14 md:w-20 md:h-20 rounded-xl flex items-center justify-center overflow-hidden"
                style={{
                  background: isUrgent
                    ? colors.error
                    : (lightDigitBoxes && !isDark)
                      ? (colors.accentMuted || 'hsla(35, 80%, 50%, 0.12)')
                      : colors.buttonPrimary,
                  border: lightDigitBoxes && !isDark ? `1px solid ${colors.borderAccent || 'hsla(25, 85%, 40%, 0.35)'}` : undefined,
                  boxShadow: isUrgent ? undefined : (lightDigitBoxes && !isDark) ? '0 2px 8px rgba(0,0,0,0.06)' : `0 8px 30px ${colors.shadowPrimary}`,
                }}
              >
                <span
                  className="text-2xl md:text-4xl font-bold"
                  style={{
                    color: isUrgent ? 'white' : (lightDigitBoxes && !isDark) ? colors.primary : colors.primaryText,
                  }}
                >
                  {String(unit.value).padStart(2, '0')}
                </span>
              </motion.div>
              {showLabels && (
                <p
                  className="text-xs md:text-sm mt-2 font-medium"
                  style={{ color: labelColor }}
                >
                  {unit.label}
                </p>
              )}
            </div>
            {index < timeUnits.length - 1 && (
              <span
                className="text-2xl md:text-3xl font-bold -mt-6"
                style={{ color: isUrgent ? colors.error : colors.accent, opacity: 0.7 }}
              >
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
