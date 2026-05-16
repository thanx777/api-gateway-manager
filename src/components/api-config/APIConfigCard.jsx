import React, { useState } from 'react';
import { Edit2, Trash2, Eye, EyeOff, Power, TerminalSquare } from 'lucide-react';
import { ProviderBadge } from './ProviderBadge';
import Button from '../common/Button';
import Card from '../common/Card';

export default function APIConfigCard({ config, onEdit, onDelete, onToggle }) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  
  const maskedApiKey = config.apiKey 
    ? config.apiKey.slice(0, 8) + '••••••••' + config.apiKey.slice(-4)
    : '';

  const handleLaunchCC = async () => {
    setIsLaunching(true);
    try {
      // 1. 将该配置同步到后端代理服务器 (代理服务在 3001 端口)
      const applyRes = await fetch('http://localhost:3001/api/apply-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: config.baseUrl,
          apiKey: config.apiKey,
          model: config.model
        })
      });
      if (!applyRes.ok) throw new Error('同步配置失败，请确认后端已启动');
      
      // 2. 呼出 CC 控制台终端
      const launchRes = await fetch('http://localhost:3001/api/launch-cc', {
        method: 'POST'
      });
      if (!launchRes.ok) throw new Error('呼出终端失败');
      
      alert('已成功拉起 CC 控制台!');
    } catch (error) {
      alert(error.message + '\n(请确保您已经先运行了"start.bat"保持网关工作)');
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <Card hover className="p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <ProviderBadge provider={config.provider} />
            <div>
              <h3 className="text-lg font-display font-semibold text-white">
                {config.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(config.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLaunchCC}
              disabled={isLaunching}
              className="px-3 py-1.5 flex items-center space-x-1 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors cursor-pointer disabled:opacity-50"
              title="使用此配置启动 Claude Code"
            >
              <TerminalSquare className="w-4 h-4" />
              <span className="text-xs font-semibold whitespace-nowrap">拉起 CC</span>
            </button>
            <button
              onClick={() => onToggle(config.id)}
              className={`p-2 rounded-lg transition-colors ${
                config.status === 'active' 
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                  : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
              }`}
              title={config.status === 'active' ? '已启用' : '已禁用'}
            >
              <Power className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(config)}
              className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(config.id)}
              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">API密钥:</span>
            <div className="flex items-center space-x-2">
              <code className="text-gray-300 font-code text-xs">
                {showApiKey ? config.apiKey : maskedApiKey}
              </code>
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">基础URL:</span>
            <code className="text-gray-300 font-code text-xs">
              {config.baseUrl}
            </code>
          </div>

          {config.model && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">模型:</span>
              <span className="text-gray-300 font-medium">
                {config.model}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-2 ${
              config.status === 'active' ? 'text-green-400' : 'text-gray-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                config.status === 'active' ? 'bg-green-400' : 'bg-gray-500'
              } ${config.status === 'active' ? 'animate-pulse' : ''}`} />
              <span className="text-sm font-medium">
                {config.status === 'active' ? '运行中' : '已停止'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
