import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'blue' | 'teal' | 'emerald' | 'amber' | 'rose' | 'indigo';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  onClick,
}) => {
  const colorStyles = {
    blue: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-all hover:shadow-md ${
        onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
        <div className={`p-2.5 rounded-xl border ${colorStyles[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </div>
        {trend && (
          <span
            className={`inline-flex items-center text-xs font-semibold ${
              trend.isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500 line-clamp-1">{subtitle}</p>
      )}
    </div>
  );
};
