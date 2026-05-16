import React, { useState } from 'react';
import { ArrowRight, Plus, Info, CheckCircle2 } from 'lucide-react';
import Select from '../common/Select';
import Button from '../common/Button';
import Card from '../common/Card';
import { PROVIDER_CONFIG, PROVIDER_OPTIONS } from '../api-config/ProviderBadge';
import { getAllFormatCategories, getFormatCategoryDescription } from '../../utils/transform/transformEngine';

export default function TransformPanel({ onTransform }) {
  const [sourceProvider, setSourceProvider] = useState('openai');
  const [targetProvider, setTargetProvider] = useState('claude');
  const [ruleName, setRuleName] = useState('');

  const formatCategories = getAllFormatCategories();
  const sourceConfig = PROVIDER_CONFIG[sourceProvider];
  const targetConfig = PROVIDER_CONFIG[targetProvider];

  const isSameFormatCategory = sourceConfig?.formatCategory === targetConfig?.formatCategory;

  const handleTransform = () => {
    if (!ruleName.trim()) {
      alert('请输入规则名称');
      return;
    }
    onTransform({
      name: ruleName,
      sourceProvider,
      targetProvider,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold text-white mb-2">
          API 转换器
        </h2>
        <p className="text-gray-400">
          将 API 请求从一种格式转换为另一种格式，同一格式类别的供应商可直接互转
        </p>
      </div>

      {/* 格式类别概览 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Info className="w-5 h-5 mr-2 text-indigo-400" />
          API 格式类别概览
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(formatCategories).map(([key, category]) => (
            <div 
              key={key}
              className="p-4 rounded-lg bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/20"
            >
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="font-medium text-white">{category.name}</span>
              </div>
              <p className="text-sm text-gray-400 mb-3">{category.description}</p>
              <div className="flex flex-wrap gap-2">
                {category.providers.map((provider) => (
                  <span 
                    key={provider.key}
                    className="px-2 py-1 rounded-full text-xs bg-white/5 text-gray-300"
                  >
                    {provider.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              转换规则名称
            </label>
            <input
              type="text"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="例如: OpenAI 转 Claude"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-indigo-500/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="flex items-center justify-center space-x-4">
            <div className="flex-1">
              <Select
                label="源 API"
                value={sourceProvider}
                onChange={(e) => setSourceProvider(e.target.value)}
                options={PROVIDER_OPTIONS}
              />
              {sourceConfig && (
                <div className="mt-2 p-2 rounded-lg bg-white/5">
                  <p className="text-xs text-gray-500">
                    格式类别: {getFormatCategoryDescription(sourceConfig.formatCategory).name}
                  </p>
                </div>
              )}
            </div>

            <div className="flex-shrink-0 mt-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
                <ArrowRight className="w-6 h-6 text-indigo-400" />
              </div>
            </div>

            <div className="flex-1">
              <Select
                label="目标 API"
                value={targetProvider}
                onChange={(e) => setTargetProvider(e.target.value)}
                options={PROVIDER_OPTIONS}
              />
              {targetConfig && (
                <div className="mt-2 p-2 rounded-lg bg-white/5">
                  <p className="text-xs text-gray-500">
                    格式类别: {getFormatCategoryDescription(targetConfig.formatCategory).name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {isSameFormatCategory && sourceProvider !== targetProvider && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-sm text-green-400 font-medium">
                  同一格式类别，可直接互转，无需复杂转换！
                </span>
              </div>
            </div>
          )}

          {sourceProvider === targetProvider && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-400">
                源 API 和目标 API 相同，请选择不同的供应商
              </p>
            </div>
          )}

          <Button 
            variant="primary" 
            className="w-full"
            onClick={handleTransform}
            disabled={sourceProvider === targetProvider}
          >
            <Plus className="w-5 h-5" />
            <span>创建转换规则</span>
          </Button>
        </div>
      </Card>

      {/* 支持的供应商 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          支持的所有 API 供应商
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(PROVIDER_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div
                key={key}
                className={`p-3 rounded-lg border transition-all ${
                  key === sourceProvider ? 'border-indigo-500/50 bg-indigo-500/10' :
                  key === targetProvider ? 'border-purple-500/50 bg-purple-500/10' :
                  'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <Icon className={`w-4 h-4 bg-gradient-to-r ${config.color} bg-clip-text`} />
                  <span className="text-sm font-medium text-white">{config.name}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{config.description}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
