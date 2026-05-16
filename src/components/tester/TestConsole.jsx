import React, { useState } from 'react';
import { Play, Square, Loader2, Info } from 'lucide-react';
import Select from '../common/Select';
import Button from '../common/Button';
import Card from '../common/Card';
import { PROVIDER_CONFIG, PROVIDER_OPTIONS } from '../api-config/ProviderBadge';
import { transformRequest, getFormatCategoryDescription } from '../../utils/transform/transformEngine';

export default function TestConsole({ configs, rules, onTest }) {
  const [selectedConfig, setSelectedConfig] = useState('');
  const [selectedRule, setSelectedRule] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transformedRequestBody, setTransformedRequestBody] = useState(null);

  const configOptions = [
    { value: '', label: '选择API配置' },
    ...configs.map(c => ({ value: c.id, label: `${c.name} (${c.provider})` }))
  ];

  const ruleOptions = [
    { value: '', label: '选择转换规则' },
    ...rules.map(r => ({ value: r.id, label: r.name }))
  ];

  const selectedConfigData = configs.find(c => c.id === selectedConfig);
  const selectedRuleData = rules.find(r => r.id === selectedRule);

  // 快捷生成测试数据
  const generateMockData = (provider) => {
    if (provider === 'claude') {
      return JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: "You are a helpful assistant.",
        messages: [
          {
            role: "user",
            content: "Hello, world!"
          }
        ]
      }, null, 2);
    }
    // 默认按照 OpenAI 格式兼容的模型（包括 gpt, deepseek, nvidia, glm等）
    return JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant."
        },
        {
          role: "user",
          content: "Hello!"
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    }, null, 2);
  };

  // 监听规则变化，自动填充对应的预设 JSON
  const handleRuleChange = (e) => {
    const newRuleId = e.target.value;
    setSelectedRule(newRuleId);
    const ruleData = rules.find(r => r.id === newRuleId);
    if (ruleData) {
      const mockData = generateMockData(ruleData.sourceProvider);
      setRequestBody(mockData);
      
      // 延迟触发预览
      setTimeout(() => {
        try {
          const parsedRequest = JSON.parse(mockData);
          const transformed = transformRequest(
            ruleData.sourceProvider,
            ruleData.targetProvider,
            parsedRequest
          );
          setTransformedRequestBody(transformed);
        } catch (err) {}
      }, 50);
    } else {
      setTransformedRequestBody(null);
    }
  };

  // 实时预览转换
  const previewTransform = () => {
    if (!selectedRuleData || !requestBody.trim()) {
      setTransformedRequestBody(null);
      return;
    }

    try {
      const parsedRequest = JSON.parse(requestBody);
      const transformed = transformRequest(
        selectedRuleData.sourceProvider,
        selectedRuleData.targetProvider,
        parsedRequest
      );
      setTransformedRequestBody(transformed);
    } catch (e) {
      setTransformedRequestBody({ error: '请求格式错误' });
    }
  };

  const handleTest = async () => {
    if (!selectedConfig || !selectedRule) {
      setError('请选择API配置和转换规则');
      return;
    }

    if (!requestBody.trim()) {
      setError('请输入测试请求');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResponse(null);

      const parsedRequest = JSON.parse(requestBody);
      
      // 转换请求
      const transformed = transformRequest(
        selectedRuleData.sourceProvider,
        selectedRuleData.targetProvider,
        parsedRequest
      );
      setTransformedRequestBody(transformed);

      // 模拟测试
      const result = await onTest({
        configId: selectedConfig,
        ruleId: selectedRule,
        request: parsedRequest,
        transformedRequest: transformed,
      });

      setResponse(result);
    } catch (err) {
      setError(err.message || '请求失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-display font-bold text-white mb-2">
          API 测试控制台
        </h2>
        <p className="text-gray-400">
          在线测试 API 转换和调用
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">配置选择</h3>
          <div className="space-y-4">
            <Select
              label="API 配置"
              value={selectedConfig}
              onChange={(e) => setSelectedConfig(e.target.value)}
              options={configOptions}
            />
            <Select
              label="转换规则"
              value={selectedRule}
              onChange={handleRuleChange}
              options={ruleOptions}
            />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">测试请求</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                请求体 (JSON 格式)
              </label>
              <textarea
                value={requestBody}
                onChange={(e) => {
                  setRequestBody(e.target.value);
                  setTimeout(previewTransform, 200);
                }}
                placeholder={`{
  "model": "gpt-4",
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "max_tokens": 100
}`}
                className="w-full h-40 px-4 py-3 rounded-xl bg-slate-900/50 border border-indigo-500/20 text-gray-300 font-code text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
              />
            </div>
            <Button 
              variant="primary" 
              className="w-full"
              onClick={handleTest}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>测试中...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>发送测试请求</span>
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* 转换预览 */}
      {transformedRequestBody && selectedRuleData && !transformedRequestBody.error && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Info className="w-5 h-5 mr-2 text-indigo-400" />
            转换预览
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">
                原始请求 ({PROVIDER_CONFIG[selectedRuleData.sourceProvider]?.name})
              </h4>
              <div className="bg-slate-900/50 rounded-xl p-4 overflow-x-auto">
                <pre className="text-sm text-gray-300 font-code whitespace-pre-wrap">
                  {JSON.stringify(JSON.parse(requestBody || '{}'), null, 2)}
                </pre>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">
                转换后请求 ({PROVIDER_CONFIG[selectedRuleData.targetProvider]?.name})
              </h4>
              <div className="bg-slate-900/50 rounded-xl p-4 overflow-x-auto">
                <pre className="text-sm text-green-400 font-code whitespace-pre-wrap">
                  {JSON.stringify(transformedRequestBody, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <Card className="p-6 border-red-500/30 bg-red-500/5">
          <h3 className="text-lg font-semibold text-red-400 mb-2">错误信息</h3>
          <pre className="text-sm text-red-300 font-code whitespace-pre-wrap">
            {error}
          </pre>
        </Card>
      )}

      {response && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">响应结果</h3>
          <div className="bg-slate-900/50 rounded-xl p-4 overflow-x-auto">
            <pre className="text-sm text-green-400 font-code whitespace-pre-wrap">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">测试示例</h3>
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">OpenAI 兼容格式请求:</h4>
            <pre className="bg-slate-900/50 rounded-xl p-4 text-sm text-gray-300 font-code overflow-x-auto">
{`{
  "model": "gpt-4",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "max_tokens": 150,
  "stream": false
}`}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  );
}
