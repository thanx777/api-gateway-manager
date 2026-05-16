import React from 'react';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  className = '',
  ...props 
}) {
  const baseStyles = 'font-medium rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';
  
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50',
    secondary: 'bg-white/10 text-white border border-indigo-500/30 hover:bg-white/20',
    danger: 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50',
    ghost: 'text-gray-300 hover:bg-white/10 hover:text-white',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
