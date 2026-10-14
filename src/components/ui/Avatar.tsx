import React from 'react';

export interface AvatarProps {
  initials?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  initials,
  name,
  size = 'md',
  className = '',
}) => {
  const getInitials = () => {
    if (initials) return initials.slice(0, 2).toUpperCase();
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    return 'SS';
  };

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-medium',
    lg: 'w-14 h-14 text-base font-semibold',
    xl: 'w-20 h-20 text-xl font-bold',
  };

  // Deterministic friendly color scheme based on name
  const colors = [
    'bg-teal-600 text-white',
    'bg-indigo-600 text-white',
    'bg-amber-600 text-white',
    'bg-emerald-600 text-white',
    'bg-slate-700 text-white',
    'bg-cyan-700 text-white',
  ];
  const charCode = (name || initials || 'A').charCodeAt(0);
  const color = colors[charCode % colors.length];

  return (
    <div
      className={`rounded-full flex items-center justify-center select-none shadow-inner ${color} ${sizes[size]} ${className}`}
      aria-label={name || 'Student avatar'}
    >
      {getInitials()}
    </div>
  );
};
