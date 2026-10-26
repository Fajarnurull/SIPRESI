import React from 'react';
import { UserRole } from '../../types';
import { Shield, BookOpen, Award, GraduationCap } from 'lucide-react';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md' }) => {
  const configs = {
    admin: {
      label: 'Admin',
      loginAs: 'Username',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      accentColor: '#2563EB',
      icon: Shield
    },
    guru_bk: {
      label: 'Guru BK',
      loginAs: 'NIP',
      bg: 'bg-teal-50 text-teal-800 border-teal-200',
      accentColor: '#0D9488',
      icon: BookOpen
    },
    kepala_sekolah: {
      label: 'Kepala Sekolah',
      loginAs: 'NIP',
      bg: 'bg-purple-50 text-purple-800 border-purple-200',
      accentColor: '#7C3AED',
      icon: Award
    },
    siswa: {
      label: 'Siswa',
      loginAs: 'NISN',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      accentColor: '#16A34A',
      icon: GraduationCap
    }
  };

  const current = configs[role] || configs.admin;
  const Icon = current.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium gap-1',
    md: 'text-xs px-2.5 py-1 font-semibold gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 font-bold gap-2'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${current.bg} ${sizeClasses[size]} shadow-xs`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span>{current.label}</span>
    </span>
  );
};
