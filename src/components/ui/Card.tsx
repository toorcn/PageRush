'use client';

import { type ReactNode, type HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'glass' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const variantStyles = {
  default: 'bg-white shadow-sm border border-gray-100',
  glass: 'bg-white/70 backdrop-blur-md shadow-md border border-gray-200/60',
  bordered: 'bg-white border border-gray-200',
  elevated: 'bg-white shadow-lg border border-gray-100',
};

const paddingStyles = {
  none: '',
  sm: 'p-3 lg:p-4',
  md: 'p-4 lg:p-6',
  lg: 'p-6 lg:p-8',
};

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`
        rounded-xl ${variantStyles[variant]} ${paddingStyles[padding]}
        ${hover ? 'transition-all duration-200 hover:shadow-lg hover:border-gray-200 hover:-translate-y-0.5' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function CardTitle({ children, icon, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-lg lg:text-xl font-semibold text-gray-900 flex items-center gap-2.5 ${className}`}>
      {icon && <span className="text-gray-500">{icon}</span>}
      {children}
    </h3>
  );
}

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return (
    <p className={`text-sm text-gray-500 mt-1 ${className}`}>
      {children}
    </p>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
