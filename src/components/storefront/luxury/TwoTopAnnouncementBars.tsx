import React, { useState, useEffect } from 'react';
import { Truck, Gift, Percent, Phone, Clock } from 'lucide-react';

export interface TopBarLine {
  id: string;
  text: string;
  visible?: boolean;
}

export interface TopBarItem {
  text?: string;
  lines?: TopBarLine[];
  bg_color?: string;
  text_color?: string;
  icon?: 'truck' | 'gift' | 'percent' | 'phone' | 'clock';
  link?: string;
  visible?: boolean;
  phone?: string;
}

const iconMap = {
  truck: Truck,
  gift: Gift,
  percent: Percent,
  phone: Phone,
  clock: Clock,
};

const ROTATE_INTERVAL_MS = 4000;

/** تأكد أن القيمة تعني "مفعّل" (يدعم boolean أو string من JSON) */
function isVisible(v: unknown): boolean {
  if (v === false || v === 'false') return false;
  return true;
}

/** شريط واحد مع دوران النصوص إذا كانت هناك أكثر من سطر — النص من الإعدادات فقط */
function SingleBar({ bar, dir }: { bar: TopBarItem; dir: 'rtl' | 'ltr' }) {
  const linesArr = Array.isArray(bar.lines) ? bar.lines : [];
  const visibleLines = linesArr
    .filter((l) => isVisible(l?.visible))
    .map((l) => String(l?.text ?? '').trim())
    .filter((t) => t.length > 0);
  const legacyText = (bar.text && String(bar.text).trim()) || '';
  const displayLines = visibleLines.length > 0 ? visibleLines : (legacyText ? [legacyText] : []);

  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (displayLines.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % displayLines.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [displayLines.length]);

  const hasPhone = !!bar.phone && String(bar.phone).trim().length > 0;
  const hasText = displayLines.length > 0;
  const hasAnyLine = linesArr.length > 0;
  if (!hasText && !hasPhone && !hasAnyLine) return null;

  const bg = (bar.bg_color && String(bar.bg_color).trim()) ? String(bar.bg_color) : '#dc2626';
  const fg = (bar.text_color && String(bar.text_color).trim()) ? String(bar.text_color) : '#ffffff';
  const iconKey = bar.icon && iconMap[bar.icon] ? bar.icon : 'truck';
  const IconComponent = iconMap[iconKey];
  const currentText = displayLines[index] ?? displayLines[0] ?? '';

  const content = (
    <div
      className="flex items-center justify-center gap-2 py-2.5 text-xs md:text-sm font-medium"
      style={{ backgroundColor: bg, color: fg }}
      dir={dir}
    >
      <IconComponent className="w-4 h-4 flex-shrink-0" />
      {currentText && <span>{currentText}</span>}
      {bar.phone && String(bar.phone).trim() && (
        <a href={`tel:${String(bar.phone).trim()}`} className="hover:opacity-90 flex items-center gap-1" style={{ color: fg }}>
          <Phone className="w-3.5 h-3.5" />
          {String(bar.phone).trim()}
        </a>
      )}
    </div>
  );

  if (bar.link && String(bar.link).trim()) {
    return (
      <a href={String(bar.link).trim()} target="_blank" rel="noopener noreferrer" className="block hover:opacity-95 transition-opacity">
        {content}
      </a>
    );
  }
  return content;
}

interface TwoTopAnnouncementBarsProps {
  bars: TopBarItem[];
  dir?: 'rtl' | 'ltr';
}

/** شريطا الإعلانات العلويان من إعدادات المتجر - أي شريط مفعّل (visible !== false) يُعرض */
export function TwoTopAnnouncementBars({ bars, dir = 'rtl' }: TwoTopAnnouncementBarsProps) {
  const barsList = Array.isArray(bars) ? bars : [];
  const visible = barsList.filter((b) => b != null && isVisible(b.visible));
  if (visible.length === 0) return null;

  return (
    <div dir={dir} className="flex flex-col">
      {visible.map((bar, index) => (
        <SingleBar key={index} bar={bar} dir={dir} />
      ))}
    </div>
  );
}
