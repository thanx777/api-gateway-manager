import React from 'react';
import { useAPIConfig } from '../context/APIConfigContext';
import { useTransform } from '../context/TransformContext';
import { PROVIDER_CONFIG } from '../components/api-config/ProviderBadge';
import { API_FORMAT_CATEGORIES } from '../components/api-config/ProviderBadge';
import TestConsole from '../components/tester/TestConsole';

export default function APITester() {
  const { configs } = useAPIConfig();
  const { rules } = useTransform();

  const handleTest = async ({ configId, ruleId, request, transformedRequest }) => {
    const config = configs.find(c => c.id === configId);
    const rule = rules.find(r => r.id === ruleId);

    if (!config || !rule) {
      throw new Error('未找到对应的配置或规则');
    }

    const targetConfig = PROVIDER_CONFIG[rule.targetProvider];

    // Step 1: Apply config to proxy
    const applyRes = await fetch('http://localhost:3001/api/apply-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiUrl: config.baseUrl,
        apiKey: config.apiKey,
        model: config.model
      })
    });

    if (!applyRes.ok) {
      throw new Error('无法连接代理服务器 (端口 3001)，请确认已运行 start.bat');
    }

    // Step 2: Determine target endpoint based on format category
    const endpoint = targetConfig?.formatCategory === API_FORMAT_CATEGORIES.ANTHROPIC_CLAUDE
      ? 'http://localhost:3001/v1/messages'
      : 'http://localhost:3001/v1/chat/completions';

    // Step 3: Send real request through proxy
    const proxyRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transformedRequest)
    });

    const responseData = await proxyRes.json();

    if (!proxyRes.ok) {
      throw new Error(
        responseData.error?.message || responseData.error || `请求失败 (HTTP ${proxyRes.status})`
      );
    }

    return {
      success: true,
      status: proxyRes.status,
      configId,
      ruleId,
      originalRequest: request,
      transformedRequest,
      response: responseData,
    };
  };

  return (
    <div className="animate-fade-in">
      <TestConsole
        configs={configs}
        rules={rules}
        onTest={handleTest}
      />
    </div>
  );
}
