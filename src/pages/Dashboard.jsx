import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, RefreshCw, Play, BookOpen, ArrowRight, Layers, Database } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { PROVIDER_CONFIG, API_FORMAT_CATEGORIES } from '../components/api-config/ProviderBadge';

const features = [
  {
    icon: Settings,
    title: 'API 配置管理',
    description: '统一管理多个 AI 服务提供商的 API 密钥和配置',
    link: '/config',
    color: 'from-green-400 to-emerald-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: RefreshCw,
    title: 'API 转换器',
    description: '将 API 请求从一种格式转换为另一种格式，支持多种供应商',
    link: '/transform',
    color: 'from-blue-400 to-cyan-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Play,
    title: 'API 测试',
    description: '在线测试转换后的 API 调用，实时预览转换结果',
    link: '/test',
    color: 'from-purple-400 to-pink-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: BookOpen,
    title: '使用指南',
    description: '快速开始、使用场景和详细文档',
    link: '/guide',
    color: 'from-orange-400 to-red-500',
    bgColor: 'bg-orange-500/10',
  },
];

// 按格式类别分组供应商
const formatCategories = {
  [API_FORMAT_CATEGORIES.OPENAI_COMPATIBLE]: {
    name: 'OpenAI 兼容',
    description: '所有采用 OpenAI API 格式的供应商，可直接互转',
    color: 'green',
    providers: [],
  },
  [API_FORMAT_CATEGORIES.ANTHROPIC_CLAUDE]: {
    name: 'Anthropic Claude',
    description: 'Anthropic Claude 独特的 API 格式',
    color: 'orange',
    providers: [],
  },
};

// 填充数据
Object.entries(PROVIDER_CONFIG).forEach(([key, config]) => {
  if (formatCategories[config.formatCategory]) {
    formatCategories[config.formatCategory].providers.push({ key, ...config });
  }
});

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-6 shadow-lg shadow-indigo-500/30">
          <Layers className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-5xl font-display font-bold mb-4">
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            API 网关管理器
          </span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          统一管理 {Object.keys(PROVIDER_CONFIG).length} 种 AI 服务，同一格式类别可直接互转，支持跨格式转换
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link key={feature.link} to={feature.link}>
              <Card hover className="p-6 h-full relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity`} />
                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 bg-gradient-to-r ${feature.color} bg-clip-text`} />
                  </div>
                  <h3 className="text-xl font-display font-bold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    {feature.description}
                  </p>
                  <div className={`inline-flex items-center space-x-2 text-sm bg-gradient-to-r ${feature.color} bg-clip-text text-transparent font-medium`}>
                    <span>进入</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* API 格式类别展示 */}
      <Card className="p-6">
        <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center">
          <Database className="w-6 h-6 mr-3 text-indigo-400" />
          按 API 格式类别分组的供应商
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(formatCategories).map(([key, category]) => (
            <div key={key} className="p-6 rounded-xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/20">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-3 h-3 rounded-full bg-${category.color}-500 animate-pulse`} />
                <h3 className="text-lg font-semibold text-white">{category.name}</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">{category.description}</p>
              <div className="space-y-2">
                {category.providers.map((provider) => {
                  const Icon = provider.icon;
                  return (
                    <div
                      key={provider.key}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <Icon className={`w-5 h-5 bg-gradient-to-r ${provider.color} bg-clip-text`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{provider.name}</p>
                        <p className="text-xs text-gray-500">{provider.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-display font-bold text-white mb-6">
          所有支持的 API 服务提供商
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(PROVIDER_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div
                key={key}
                className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-indigo-500/30 transition-all group"
              >
                <Icon className={`w-8 h-8 mb-2 bg-gradient-to-r ${config.color} bg-clip-text group-hover:scale-110 transition-transform`} />
                <h3 className="font-semibold text-white">{config.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{config.description}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card gradient className="p-8 text-center">
        <h2 className="text-2xl font-display font-bold text-white mb-4">
          快速开始
        </h2>
        <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
          三步即可开始使用 API 网关管理器
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="p-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-3 text-white font-bold">
              1
            </div>
            <h3 className="font-semibold text-white mb-2">添加 API 配置</h3>
            <p className="text-sm text-gray-400">在配置管理中添加您的 API 密钥</p>
          </div>
          <div className="p-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-3 text-white font-bold">
              2
            </div>
            <h3 className="font-semibold text-white mb-2">创建转换规则</h3>
            <p className="text-sm text-gray-400">设置源格式和目标格式的映射</p>
          </div>
          <div className="p-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-3 text-white font-bold">
              3
            </div>
            <h3 className="font-semibold text-white mb-2">开始使用</h3>
            <p className="text-sm text-gray-400">测试并应用转换后的 API 调用</p>
          </div>
        </div>
        <div className="mt-6">
          <Link to="/guide">
            <Button variant="primary">
              <BookOpen className="w-5 h-5" />
              <span>查看完整指南</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
