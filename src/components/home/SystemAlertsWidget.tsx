import React from 'react';
import { AlertTriangle, Info, OctagonAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertType = 'error' | 'warning' | 'info';

export interface SystemAlert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  timestamp: string;
}

const iconMap: Record<SystemAlert['type'], React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  error: OctagonAlert,
  warning: AlertTriangle,
  info: Info,
};

const toneMap: Record<SystemAlert['type'], { color: string; bg: string }> = {
  error: { color: 'var(--danger)', bg: 'color-mix(in srgb, var(--danger) 18%, transparent)' },
  warning: { color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 18%, transparent)' },
  info: { color: 'var(--accent)', bg: 'color-mix(in srgb, var(--accent) 18%, transparent)' },
};

export interface SystemAlertsWidgetProps {
  alerts: SystemAlert[];
  className?: string;
}

export const SystemAlertsWidget: React.FC<SystemAlertsWidgetProps> = ({ alerts, className }) => {
  return (
    <aside
      className={cn(
        'flex h-full flex-col gap-[var(--spacing-md)] rounded-[var(--radius-l)] border border-border bg-card/88 p-[var(--spacing-lg)] shadow-md backdrop-blur-xl',
        className
      )}
      data-component="system-alerts"
      aria-label="تنبيهات النظام"
    >
      <div>
        <h2 className="text-sm font-semibold text-foreground">تنبيهات النظام</h2>
        <p className="text-xs text-muted-foreground">إجراءات مطلوبة لضمان الاستقرار</p>
      </div>
      <ul className="flex flex-col gap-[var(--spacing-sm)]">
        {alerts.map((alert) => {
          const Icon = iconMap[alert.type];
          const tones = toneMap[alert.type];
          return (
            <li
              key={alert.id}
              className="rounded-[var(--radius-m)] border border-border p-[var(--spacing-md)]"
              style={{
                backgroundColor: tones.bg,
                color: tones.color,
              }}
            >
              <div className="flex items-start justify-between gap-[var(--spacing-sm)]">
                <div className="flex items-center gap-[var(--spacing-sm)]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {alert.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alert.description}
                    </p>
                  </div>
                </div>
                <time className="text-xs text-muted-foreground">
                  {alert.timestamp}
                </time>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default SystemAlertsWidget;
