import React from 'react';
import { BookOpen, Code, Copy, Check, Info } from 'lucide-react';
import Card from '../components/common/Card';
import { PROVIDER_CONFIG, API_FORMAT_CATEGORIES } from '../components/api-config/ProviderBadge';

export default function UsageGuide() {
  // 按格式类别分组
  const formatCategories = {
    [API_FORMAT_CATEGORIES.OPENAI_COMPATIBLE]: {
      name: 'OpenAI 兼容',
      description: '所有采用 OpenAI API 格式的供应商，可直接互转',
      providers: [],
    },
    [API_FORMAT_CATEGORIES.ANTHROPIC_CLAUDE]: {
      name: 'Anthropic Claude',
      description: 'Anthropic Claude 独特的 API 格式',
      providers: [],
    },
  };

  // 填充数据
  Object.entries(PROVIDER_CONFIG).forEach(([key, config]) => {
    if (formatCategories[config.formatCategory]) {
      formatCategories[config.formatCategory].providers.push({ key, ...config });
    }
  });

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-4xl font-display font-bold mb-4">
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            使用指南
          </span>
        </h1>
        <p className="text-gray-400 text-lg">
          快速了解如何使用 API 网关管理器，支持 {Object.keys(PROVIDER_CONFIG).length} 种 AI 服务！
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center">
          <BookOpen className="w-6 h-6 mr-3 text-indigo-400" />
          快速开始
        </h2>
        
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
            <h3 className="text-lg font-semibold text-white mb-3">
              第一步：添加 API 配置
            </h3>
            <p className="text-gray-400 mb-4">
              在「API 配置管理」页面，点击「添加新配置」，填写配置信息。支持 {Object.keys(PROVIDER_CONFIG).length} 种 AI 服务！
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>配置名称：给配置起一个容易识别的名字</li>
              <li>API 供应商：从 {Object.keys(PROVIDER_CONFIG).length} 种 AI 服务中选择</li>
              <li>API 密钥：从对应平台获取的密钥</li>
              <li>基础 URL：API 端点地址（系统会自动填充默认地址）</li>
              <li>模型名称（可选）：指定使用的模型</li>
            </ul>
          </div>

          <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
            <h3 className="text-lg font-semibold text-white mb-3">
              第二步：创建转换规则
            </h3>
            <p className="text-gray-400 mb-4">
              在「API 转换器」页面，创建一个转换规则：
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>同一格式类别的供应商之间可直接互转（如：OpenAI ↔ DeepSeek ↔ Qwen</li>
              <li>跨格式类别需要转换（如：OpenAI ↔ Claude）</li>
              <li>规则名称：为规则起一个描述性名称</li>
              <li>源 API：选择要转换的原始 API 格式</li>
              <li>目标 API：选择要转换成的目标格式</li>
            </ul>
          </div>

          <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <h3 className="text-lg font-semibold text-white mb-3">
              第三步：测试和使用
            </h3>
            <p className="text-gray-400 mb-4">
              在「API 测试」页面，可以验证转换规则是否正确：
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>选择一个 API 配置</li>
              <li>选择一个转换规则</li>
              <li>输入测试请求（JSON 格式）</li>
              <li>实时预览转换结果</li>
              <li>点击「发送测试请求」查看结果</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center">
          <Info className="w-6 h-6 mr-3 text-indigo-400" />
          支持的 API 格式类别
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(formatCategories).map(([key, category]) => (
            <div key={key} className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">{category.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{category.description}</p>
              <div className="space-y-2">
                {category.providers.map((provider) => {
                  const Icon = provider.icon;
                  return (
                    <div
                      key={provider.key}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-white/5"
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
        <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center">
          <Code className="w-6 h-6 mr-3 text-green-400" />
          使用场景示例
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">
              场景 1：在 Claude Code 中使用 DeepSeek
            </h3>
            <p className="text-gray-400 mb-4">
              如果你有一个只支持 OpenAI 格式的工具，但是想使用 DeepSeek API：
            </p>
            <div className="bg-slate-900/50 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-sm text-gray-400 mb-2">1. 添加 DeepSeek API 配置</p>
                <CodeBlock code={`{
  "配置名称": "我的 DeepSeek",
  "供应商": "DeepSeek",
  "API密钥": "sk-...",
  "基础URL": "https://api.deepseek.com/v1"
}`} />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">2. 创建转换规则（同一格式类别，无需复杂转换）</p>
                <CodeBlock code={`{
  "规则名称": "OpenAI → DeepSeek",
  "源API": "OpenAI",
  "目标API": "DeepSeek"
}`} />
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              场景 2：国产 AI 服务统一管理
            </h3>
            <p className="text-gray-400 mb-4">
              通过 API 网关管理器，可以在一个界面管理所有国产 AI 服务：
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['DeepSeek', 'Qwen', 'GLM', 'Doubao', 'Moonshot', 'Minimax'].map((name) => (
                <div key={name} className="p-3 rounded-lg bg-white/5 text-center">
                  <p className="text-sm text-gray-300">{name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              场景 3：OpenAI 兼容格式互转
            </h3>
            <p className="text-gray-400 mb-4">
              所有 OpenAI 兼容格式的供应商都可以直接互相使用：
            </p>
            <div className="bg-slate-900/50 rounded-xl p-4">
              <div className="text-center text-gray-300 space-y-2">
                <p>OpenAI ↔ DeepSeek</p>
                <p>OpenAI ↔ GLM ↔ Qwen ↔ Doubao ↔ ...</p>
                <p>所有 OpenAI 兼容格式的供应商都可直接互转！</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-display font-bold text-white mb-6">
          API 字段映射表
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-green-400 mb-3">
              OpenAI 兼容 → Claude
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-400">OpenAI 字段</th>
                    <th className="text-left py-3 px-4 text-gray-400">Claude 字段</th>
                    <th className="text-left py-3 px-4 text-gray-400">说明</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 font-code">model</td>
                    <td className="py-3 px-4 font-code">model</td>
                    <td className="py-3 px-4">直接映射</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 font-code">messages</td>
                    <td className="py-3 px-4 font-code">messages</td>
                    <td className="py-3 px-4">格式相同</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 font-code">max_tokens</td>
                    <td className="py-3 px-4 font-code">max_tokens</td>
                    <td className="py-3 px-4">直接映射</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function CodeBlock({ code }) {
  return (
    <div className="relative group">
      <pre className="bg-slate-900/70 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-code">
        {code}
      </pre>
      <button
        onClick={() => navigator.clipboard.writeText(code)}
        className="absolute top-2 right-2 p-2 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
        title="复制代码"
      >
        <Copy className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
}
