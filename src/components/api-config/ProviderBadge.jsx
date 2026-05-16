import React from 'react';
import { 
  Bot, Cpu, Sparkles, Zap, 
  Circle, Brain, Cog, Layers, Database, 
  Globe, Code, Terminal, Command
} from 'lucide-react';

// API 格式类别
export const API_FORMAT_CATEGORIES = {
  OPENAI_COMPATIBLE: 'openai_compatible',
  ANTHROPIC_CLAUDE: 'anthropic_claude',
};

// 供应商配置
export const PROVIDER_CONFIG = {
  openai: {
    name: 'OpenAI',
    icon: Bot,
    color: 'from-green-400 to-emerald-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    formatCategory: API_FORMAT_CATEGORIES.OPENAI_COMPATIBLE,
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4-turbo',
    description: 'GPT 系列模型，生态完善',
  },
  claude: {
    name: 'Claude',
    icon: Sparkles,
    color: 'from-orange-400 to-red-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    formatCategory: API_FORMAT_CATEGORIES.ANTHROPIC_CLAUDE,
    defaultBaseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-3-5-sonnet-20241022',
    description: 'Anthropic Claude 系列，推理能力强',
  },
  deepseek: {
    name: 'DeepSeek',
    icon: Zap,
    color: 'from-blue-400 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    formatCategory: API_FORMAT_CATEGORIES.OPENAI_COMPATIBLE,
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    description: '国产大模型，性价比高',
  },
  glm: {
    name: 'GLM',
    icon: Cpu,
    color: 'from-purple-400 to-pink-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    formatCategory: API_FORMAT_CATEGORIES.OPENAI_COMPATIBLE,
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4',
    description: '智谱 GLM 系列，中文能力强',
  },
  nvidia: {
    name: 'NVIDIA',
    icon: Circle,
    color: 'from-green-500 to-teal-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    formatCategory: API_FORMAT_CATEGORIES.OPENAI_COMPATIBLE,
    defaultBaseUrl: 'https://integrate.api.nvidia.com/v1',
    defaultModel: 'mistralai/mixtral-8x7b-instruct-v0.1',
    description: 'NVIDIA NIM/Build，GPU 加速（OpenAI 兼容格式）',
  },
  qwen: {
    name: 'Qwen',
    icon: Brain,
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    formatCategory: API_FORMAT_CATEGORIES.OPENAI_COMPATIBLE,
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    description: '通义千问，阿里出品',
  },
  doubao: {
    name: 'Doubao',
    icon: Cog,
    color: 'from-pink-400 to-rose-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    formatCategory: API_FORMAT_CATEGORIES.OPENAI_COMPATIBLE,
    defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    defaultModel: 'ep-20240516xxxx',
    description: '豆包，字节跳动出品',
  },
  minimax: {
    name: 'Minimax',
    icon: Layers,
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    formatCategory: API_FORMAT_CATEGORIES.OPENAI_COMPATIBLE,
    defaultBaseUrl: 'https://api.minimax.chat/v1',
    defaultModel: 'abab6.5-chat',
    description: 'Minimax 模型',
  },
  moonshot: {
    name: 'Moonshot',
    icon: Database,
    color: 'from-indigo-400 to-purple-500',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    formatCategory: API_FORMAT_CATEGORIES.OPENAI_COMPATIBLE,
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    description: '月之暗面，支持长文本',
  },
  groq: {
    name: 'Groq',
    icon: Command,
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    formatCategory: API_FORMAT_CATEGORIES.OPENAI_COMPATIBLE,
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.1-70b-versatile',
    description: 'Groq，超高速推理',
  },
  ollama: {
    name: 'Ollama',
    icon: Terminal,
    color: 'from-cyan-400 to-blue-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    formatCategory: API_FORMAT_CATEGORIES.OPENAI_COMPATIBLE,
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama2',
    description: '本地模型，Ollama',
  },
  openrouter: {
    name: 'OpenRouter',
    icon: Globe,
    color: 'from-violet-400 to-fuchsia-500',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    formatCategory: API_FORMAT_CATEGORIES.OPENAI_COMPATIBLE,
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    description: '模型聚合平台',
  },
  cohere: {
    name: 'Cohere',
    icon: Code,
    color: 'from-emerald-400 to-cyan-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    formatCategory: API_FORMAT_CATEGORIES.OPENAI_COMPATIBLE,
    defaultBaseUrl: 'https://api.cohere.ai/v1',
    defaultModel: 'command-r-plus',
    description: 'Cohere 模型',
  },
};

export const PROVIDER_OPTIONS = Object.entries(PROVIDER_CONFIG).map(([key, config]) => ({
  value: key,
  label: config.name,
}));

export function ProviderBadge({ provider, size = 'md' }) {
  const config = PROVIDER_CONFIG[provider] || PROVIDER_CONFIG.openai;
  const Icon = config.icon;

  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <div
      className={`
        inline-flex items-center space-x-2 rounded-lg
        ${config.bgColor} ${config.borderColor} border
        ${sizes[size]}
      `}
    >
      <Icon className={`w-4 h-4 bg-gradient-to-r ${config.color} bg-clip-text`} />
      <span className={`font-medium bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}>
        {config.name}
      </span>
    </div>
  );
}
