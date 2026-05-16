import React from 'react';

export default function Card({ 
  children, 
  className = '', 
  hover = false,
  gradient = false,
  ...props 
}) {
  return (
    <div
      className={`
        rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 
        backdrop-blur-xl border border-indigo-500/20
        ${gradient ? 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10' : ''}
        ${hover ? 'hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
