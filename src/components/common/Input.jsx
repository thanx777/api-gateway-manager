import React from 'react';

export default function Input({ 
  label, 
  error, 
  className = '', 
  ...props 
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3 rounded-xl
          bg-white/5 border border-indigo-500/20
          text-white placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
          transition-all duration-200
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
