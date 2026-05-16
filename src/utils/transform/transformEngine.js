import { API_FORMAT_CATEGORIES, PROVIDER_CONFIG } from '../../components/api-config/ProviderBadge';
import { transformOpenAIToClaude, parseClaudeResponse } from './openaiToClaude';
import { transformClaudeToOpenAI, parseOpenAIResponse } from './claudeToOpenAI';

// OpenAI 兼容格式之间的直接转换
export function transformOpenAICompatible(request) {
  return request;
}

export function parseOpenAICompatibleResponse(response) {
  return response;
}

// Claude 格式之间的直接转换
export function transformClaudeCompatible(request) {
  return request;
}

export function parseClaudeCompatibleResponse(response) {
  return response;
}

// 主转换函数
export function transformRequest(sourceProvider, targetProvider, request) {
  const sourceConfig = PROVIDER_CONFIG[sourceProvider];
  const targetConfig = PROVIDER_CONFIG[targetProvider];

  if (!sourceConfig || !targetConfig) {
    throw new Error('未知的 API 提供商');
  }

  // 同一个格式类别，直接转换
  if (sourceConfig.formatCategory === targetConfig.formatCategory) {
    console.log(`同一格式类别 (${sourceConfig.formatCategory}), 直接转换`);
    return request;
  }

  // 不同格式类别的转换
  if (sourceConfig.formatCategory === API_FORMAT_CATEGORIES.OPENAI_COMPATIBLE && 
      targetConfig.formatCategory === API_FORMAT_CATEGORIES.ANTHROPIC_CLAUDE) {
    console.log('OpenAI 兼容 → Claude 转换');
    return transformOpenAIToClaude(request);
  }

  if (sourceConfig.formatCategory === API_FORMAT_CATEGORIES.ANTHROPIC_CLAUDE && 
      targetConfig.formatCategory === API_FORMAT_CATEGORIES.OPENAI_COMPATIBLE) {
    console.log('Claude → OpenAI 兼容转换');
    return transformClaudeToOpenAI(request);
  }

  // 默认直接返回
  return request;
}

// 主响应解析函数
export function transformResponse(sourceProvider, targetProvider, response) {
  const sourceConfig = PROVIDER_CONFIG[sourceProvider];
  const targetConfig = PROVIDER_CONFIG[targetProvider];

  if (!sourceConfig || !targetConfig) {
    throw new Error('未知的 API 提供商');
  }

  // 同一个格式类别，直接转换
  if (sourceConfig.formatCategory === targetConfig.formatCategory) {
    return response;
  }

  // 不同格式类别的响应转换
  if (sourceConfig.formatCategory === API_FORMAT_CATEGORIES.OPENAI_COMPATIBLE && 
      targetConfig.formatCategory === API_FORMAT_CATEGORIES.ANTHROPIC_CLAUDE) {
    return parseClaudeResponse(response);
  }

  if (sourceConfig.formatCategory === API_FORMAT_CATEGORIES.ANTHROPIC_CLAUDE && 
      targetConfig.formatCategory === API_FORMAT_CATEGORIES.OPENAI_COMPATIBLE) {
    return parseOpenAIResponse(response);
  }

  return response;
}

// 获取可以相互转换的供应商列表
export function getCompatibleProviders(provider) {
  const config = PROVIDER_CONFIG[provider];
  if (!config) return [];

  return Object.entries(PROVIDER_CONFIG)
    .filter(([key, value]) => value.formatCategory === config.formatCategory)
    .map(([key]) => key);
}

// 获取需要转换格式的供应商列表
export function getFormatConvertibleProviders(provider) {
  const config = PROVIDER_CONFIG[provider];
  if (!config) return [];

  return Object.entries(PROVIDER_CONFIG)
    .filter(([key, value]) => value.formatCategory !== config.formatCategory)
    .map(([key]) => key);
}

// 获取格式类别描述
export function getFormatCategoryDescription(category) {
  switch (category) {
    case API_FORMAT_CATEGORIES.OPENAI_COMPATIBLE:
      return {
        name: 'OpenAI 兼容',
        description: '所有采用 OpenAI API 格式的供应商，格式完全一致，可以直接互转',
        color: 'green',
      };
    case API_FORMAT_CATEGORIES.ANTHROPIC_CLAUDE:
      return {
        name: 'Anthropic Claude',
        description: 'Anthropic Claude 独特的 API 格式',
        color: 'orange',
      };
    default:
      return { name: '未知', description: '', color: 'gray' };
  }
}

// 获取所有格式类别
export function getAllFormatCategories() {
  const categories = {};
  Object.entries(PROVIDER_CONFIG).forEach(([key, config]) => {
    if (!categories[config.formatCategory]) {
      categories[config.formatCategory] = {
        ...getFormatCategoryDescription(config.formatCategory),
        providers: [],
      };
    }
    categories[config.formatCategory].providers.push({ key, ...config });
  });
  return categories;
}
