import React from 'react';
import { Menu } from 'lucide-react';

export default function Header({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-b border-indigo-500/20">
      <div className="flex items-center justify-between px-6 py-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:block">
            <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              API网关管理器
            </h2>
            <p className="text-xs text-gray-500 mt-1">统一的API管理与转换平台</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-gray-400">在线</span>
          </div>
        </div>
      </div>
    </header>
  );
}
