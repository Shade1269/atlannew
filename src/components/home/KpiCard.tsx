import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDarkMode } from '@/shared/components/DarkModeProvider';

export type KpiDelta = {
  value: number;
  trend: 'up' | 'down';
  label?: string;
};

export interface KpiCardProps {
  title: string;
  value: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  delta?: KpiDelta | null;
  accent?: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
  footer?: React.ReactNode;
  className?: string;
  description?: string;
}

const trendIcon = {
  up: ArrowUpRight,
  down: ArrowDownRight,
} as const;

export const KpiCard: React.FC<KpiCardProps> = React.memo(
  ({ title, value, icon: Icon, delta, accent = 'primary', footer, className, description }) => {
    const { isDarkMode } = useDarkMode();
    const trendColor = delta?.trend === 'down' ? 'hsl(var(--danger))' : 'hsl(var(--success))';
    const accentColorMap: Record<NonNullable<KpiCardProps['accent']>, string> = {
      primary: 'hsl(var(--primary))',
      accent: 'hsl(var(--accent))',
      success: 'hsl(var(--success))',
      warning: 'hsl(var(--warning))',
      danger: 'hsl(var(--danger))',
    };

    const AccentIcon = delta ? trendIcon[delta.trend] : null;
    const accentColor = accentColorMap[accent];

    return (
      <article
        className={cn(
          'relative flex flex-col gap-[var(--spacing-md)] rounded-[var(--radius-l)] p-[var(--spacing-lg)] backdrop-blur-xl overflow-hidden transition-all duration-500',
          'hover:-translate-y-0.5 focus-within:outline-none focus-within:ring-2',
          isDarkMode 
            ? 'border border-border bg-card/90 shadow-md hover:shadow-lg focus-within:shadow-lg text-foreground' 
            : 'border border-slate-300/60 bg-card/95 shadow-xl hover:shadow-2xl focus-within:shadow-2xl text-foreground',
          className
        )}
        role="group"
        data-component="kpi-card"
        aria-live="polite"
      >
        {/* Accent glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(120% 60% at 100% 0%, ${accentColor}40 0%, transparent 55%)`,
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            background: `linear-gradient(135deg, ${accentColor}15 0%, transparent 50%, ${accentColor}10 100%)`,
          }}
        />
        {/* animated border shimmer */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background:
              'conic-gradient(from 180deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.12) 120deg, transparent 240deg)',
            WebkitMask:
              'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor' as any,
            padding: 1,
          }}
        />
        {/* Accent top bar */}
        <div aria-hidden className="absolute left-0 right-0 top-0 h-1 rounded-t-[inherit]" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80, ${accentColor})` }} />
        <header className="flex items-center justify-between gap-[var(--spacing-md)]">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wide drop-shadow-sm text-foreground">{title}</p>
            {description ? (
              <p className="text-xs drop-shadow-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {Icon ? (
            <span
              className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border-2 shadow-lg group-hover:scale-110 transition-transform duration-200"
              style={{ 
                borderColor: accentColor,
                background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`
              }}
              aria-hidden
            >
              <Icon className="h-5 w-5 drop-shadow-sm" style={{ color: accentColor }} />
            </span>
          ) : null}
        </header>

        <div className="flex flex-wrap items-end justify-between gap-[var(--spacing-md)]">
          <span
            className="text-4xl font-black leading-none premium-text drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
            style={{
              color: accentColor,
              textShadow: `0 0 20px ${accentColor}40, 0 2px 4px rgba(0,0,0,0.3)`,
            }}
          >
            {value}
          </span>
          {delta ? (
            <span
              className="inline-flex items-center gap-1 rounded-full border-2 px-3 py-1.5 text-sm font-bold shadow-lg"
              style={{ 
                color: trendColor,
                borderColor: trendColor,
                background: `linear-gradient(135deg, ${trendColor}20, ${trendColor}10)`
              }}
            >
              {AccentIcon ? <AccentIcon className="h-4 w-4 drop-shadow-sm" aria-hidden /> : null}
              <span className="drop-shadow-sm">{delta.value.toLocaleString('ar-EG', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</span>
              {delta.label ? <span className="sr-only">{delta.label}</span> : null}
            </span>
          ) : null}
        </div>

        {footer ? (
          <footer className="text-sm drop-shadow-sm text-muted-foreground">{footer}</footer>
        ) : null}
      </article>
    );
  }
);

KpiCard.displayName = 'KpiCard';

export default KpiCard;
