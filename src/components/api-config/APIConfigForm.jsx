import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import Card from '../common/Card';
import { PROVIDER_CONFIG, PROVIDER_OPTIONS } from './ProviderBadge';

export default function APIConfigForm({ config, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
    model: '',
    maxTokens: '',
    temperature: '',
    workDir: '',
    toolsEnabled: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (config) {
      setFormData({
        name: config.name || '',
        provider: config.provider || 'openai',
        apiKey: config.apiKey || '',
        baseUrl: config.baseUrl || '',
        model: config.model || '',
        maxTokens: config.maxTokens || '',
        temperature: config.temperature || '',
        workDir: config.workDir || '',
        toolsEnabled: config.toolsEnabled !== undefined ? config.toolsEnabled : true,
      });
    }
  }, [config]);

  const handleProviderChange = (provider) => {
    const config = PROVIDER_CONFIG[provider];
    setFormData(prev => ({
      ...prev,
      provider,
      baseUrl: config.defaultBaseUrl,
      model: config.defaultModel,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'provider') {
      handleProviderChange(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入配置名称';
    }

    if (!formData.apiKey.trim()) {
      newErrors.apiKey = '请输入API密钥';
    }

    if (!formData.baseUrl.trim()) {
      newErrors.baseUrl = '请输入基础URL';
    } else if (!isValidUrl(formData.baseUrl)) {
      newErrors.baseUrl = '请输入有效的URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      provider: formData.provider,
      apiKey: formData.apiKey.trim(),
      baseUrl: formData.baseUrl.trim(),
      model: formData.model.trim() || undefined,
      maxTokens: formData.maxTokens ? parseInt(formData.maxTokens) : undefined,
      temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
      workDir: formData.workDir.trim() || undefined,
      toolsEnabled: formData.toolsEnabled,
    });
  };

  const currentProviderConfig = PROVIDER_CONFIG[formData.provider];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {config ? '编辑API配置' : '添加新API配置'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="配置名称"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="例如: 我的 OpenAI API"
              error={errors.name}
            />

            <Select
              label="API 提供商"
              name="provider"
              value={formData.provider}
              onChange={handleChange}
              options={PROVIDER_OPTIONS}
              error={errors.provider}
            />
          </div>

          {currentProviderConfig && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
              <p className="text-sm text-gray-300">
                <span className="font-medium">{currentProviderConfig.name}</span>: {currentProviderConfig.description}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                API 格式类别: {currentProviderConfig.formatCategory === 'openai_compatible' ? 'OpenAI 兼容' : 'Anthropic Claude'}
              </p>
            </div>
          )}

          <Input
            label="API 密钥"
            name="apiKey"
            type="password"
            value={formData.apiKey}
            onChange={handleChange}
            placeholder="sk-xxxxx..."
            error={errors.apiKey}
          />

          <div>
            <Input
              label="基础 URL"
              name="baseUrl"
              type="url"
              value={formData.baseUrl}
              onChange={handleChange}
              placeholder={currentProviderConfig?.defaultBaseUrl || 'https://api.example.com/v1'}
              error={errors.baseUrl}
            />
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              填写 API 的基础地址即可，无需末尾带 <code className="text-indigo-400 bg-indigo-500/10 px-1 rounded">/chat/completions</code>，代理会自动补全路径。
              常见示例：OpenAI → <code className="text-indigo-400 bg-indigo-500/10 px-1 rounded">https://api.openai.com/v1</code>，
              DeepSeek → <code className="text-indigo-400 bg-indigo-500/10 px-1 rounded">https://api.deepseek.com/v1</code>，
              智谱 GLM → <code className="text-indigo-400 bg-indigo-500/10 px-1 rounded">https://open.bigmodel.cn/api/paas/v4</code>。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="模型名称 (可选)"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder={currentProviderConfig?.defaultModel || '模型名称'}
            />

            <Input
              label="最大 Token 数 (可选)"
              name="maxTokens"
              type="number"
              value={formData.maxTokens}
              onChange={handleChange}
              placeholder="4096"
            />

            <Input
              label="Temperature (可选)"
              name="temperature"
              type="number"
              step="0.1"
              min="0"
              max="2"
              value={formData.temperature}
              onChange={handleChange}
              placeholder="1.0"
            />
          </div>

          <Input
            label="工作目录 (可选)"
            name="workDir"
            value={formData.workDir}
            onChange={handleChange}
            placeholder="CC 启动后的工作路径，留空则为当前目录"
          />

          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="toolsEnabled"
                checked={formData.toolsEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, toolsEnabled: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
              />
              <div>
                <span className="text-sm font-medium text-gray-200">启用工具调用</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  目标模型需支持原生 function calling。如果不支持（报错 "unknown parameter: tools"），请关闭此项。
                </p>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={onClose}>
              取消
            </Button>
            <Button variant="primary" type="submit">
              {config ? '保存修改' : '添加配置'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
