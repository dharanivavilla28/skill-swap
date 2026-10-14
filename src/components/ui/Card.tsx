import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hover = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm ${
        hover
          ? 'transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
