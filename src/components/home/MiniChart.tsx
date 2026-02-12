import React from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

export interface MiniChartProps {
  title: string;
  data: number[];
  labels?: string[];
  trend?: 'up' | 'down' | 'flat';
  accent?: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
}

const accentColorMap: Record<NonNullable<MiniChartProps['accent']>, string> = {
  primary: 'var(--primary)',
  accent: 'var(--accent)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
};

const trendLabelMap: Record<NonNullable<MiniChartProps['trend']>, string> = {
  up: 'نمو إيجابي',
  down: 'انخفاض في الأداء',
  flat: 'استقرار في الأداء',
};

const normalizeData = (values: number[]) => {
  if (values.length === 0) {
    return [];
  }
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  return values.map((value) => (value - min) / range);
};

const buildPath = (values: number[], width: number, height: number) => {
  if (values.length === 0) {
    return '';
  }

  const normalized = normalizeData(values);
  const step = width / Math.max(values.length - 1, 1);
  const points = normalized.map((value, index) => {
    const x = index * step;
    const y = height - value * height;
    return `${x},${y}`;
  });

  return `M ${points.join(' L ')}`;
};

export const MiniChart: React.FC<MiniChartProps> = React.memo(
  ({ title, data, labels, trend = 'up', accent = 'accent', className }) => {
    const reduceMotion = usePrefersReducedMotion();
    const pathRef = React.useRef<SVGPathElement | null>(null);
    const [pathLength, setPathLength] = React.useState(0);
    const [dashOffset, setDashOffset] = React.useState(0);
    const chartId = React.useId();
    const width = 180;
    const height = 72;
    const path = React.useMemo(() => buildPath(data, width, height), [data]);
    const dataKey = React.useMemo(() => data.join('-'), [data]);

    React.useLayoutEffect(() => {
      if (!pathRef.current) {
        setPathLength(0);
        return;
      }
      const length = pathRef.current.getTotalLength();
      setPathLength(length);
    }, [path]);

    React.useEffect(() => {
      if (reduceMotion || pathLength === 0) {
        setDashOffset(0);
        return;
      }

      setDashOffset(pathLength);
      const frame = requestAnimationFrame(() => {
        setDashOffset(0);
      });

      return () => cancelAnimationFrame(frame);
    }, [dataKey, pathLength, reduceMotion]);

    const strokeColor = accentColorMap[accent];
    const fillId = `${chartId}-fill`;

    return (
      <figure
        className={cn(
          'w-full rounded-[var(--radius-l)] border border-border bg-card/85 p-[var(--spacing-md)] shadow-md backdrop-blur-xl',
          className
        )}
        data-component="mini-chart"
        aria-label={`${title} — ${trendLabelMap[trend]}`}
      >
        <figcaption className="mb-[var(--spacing-sm)] flex items-center justify-between text-xs text-muted-foreground">
          <span>{title}</span>
          <span>{trendLabelMap[trend]}</span>
        </figcaption>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-hidden focusable="false" className="h-24 w-full">
          <defs>
            <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.32} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill={`url(#${fillId})`} opacity={0.45} />
          <path
            ref={pathRef}
            d={path}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={pathLength || undefined}
            strokeDashoffset={dashOffset}
            style={{ transition: reduceMotion ? 'none' : 'stroke-dashoffset 600ms ease' }}
          />
          {labels && labels.length > 1 ? (
            <g aria-hidden fill="none" fontSize="10" stroke="none">
              {labels.map((label, index) => {
                const x = (index / (labels.length - 1)) * width;
                return (
                  <text
                    key={`${label}-${index}`}
                    x={x}
                    y={height + 10}
                    textAnchor="middle"
                    fill="var(--muted-foreground)"
                  >
                    {label}
                  </text>
                );
              })}
            </g>
          ) : null}
        </svg>
      </figure>
    );
  }
);

MiniChart.displayName = 'MiniChart';

export default MiniChart;
