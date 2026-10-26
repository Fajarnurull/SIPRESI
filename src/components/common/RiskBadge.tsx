import React from 'react';
import { RiskLevel } from '../../types';
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  showIcon = true,
  size = 'md'
}) => {
  const configs = {
    rendah: {
      label: 'Risiko Rendah',
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      dot: 'bg-[#16A34A]',
      icon: CheckCircle
    },
    sedang: {
      label: 'Risiko Sedang',
      bg: 'bg-amber-50 border-amber-300 text-amber-800',
      dot: 'bg-[#F59E0B]',
      icon: AlertTriangle
    },
    tinggi: {
      label: 'Risiko Tinggi',
      bg: 'bg-red-50 border-red-300 text-red-700',
      dot: 'bg-[#DC2626]',
      icon: ShieldAlert
    }
  };

  const current = configs[level] || configs.rendah;
  const Icon = current.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium gap-1',
    md: 'text-xs px-2.5 py-1 font-semibold gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 font-bold gap-2'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${current.bg} ${sizeClasses[size]} shadow-xs transition-all`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      <span>{current.label}</span>
      {score !== undefined && (
        <span className="ml-0.5 opacity-80 font-mono">({score})</span>
      )}
    </span>
  );
};
