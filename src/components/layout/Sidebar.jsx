import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings, 
  RefreshCw, 
  Play, 
  BookOpen,
  X
} from 'lucide-react';

const menuItems = [
  { path: '/', label: '首页概览', icon: LayoutDashboard },
  { path: '/config', label: 'API配置管理', icon: Settings },
  { path: '/transform', label: 'API转换器', icon: RefreshCw },
  { path: '/test', label: 'API测试', icon: Play },
  { path: '/guide', label: '使用指南', icon: BookOpen },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-slate-900/95 to-slate-800/95 
        backdrop-blur-xl border-r border-indigo-500/20 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        flex flex-col
      `}>
        <div className="p-6 border-b border-indigo-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  API网关
                </h1>
                <p className="text-xs text-gray-400">管理器</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-xl
                  transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400' 
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r-full" />
                )}
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-indigo-400' : ''}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-indigo-500/20">
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl p-4 border border-indigo-500/20">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-300">系统状态</span>
            </div>
            <p className="text-xs text-gray-500">所有服务运行正常</p>
          </div>
        </div>
      </aside>
    </>
  );
}
