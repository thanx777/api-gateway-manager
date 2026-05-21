import express from 'express';
import cors from 'cors';
import fetch from 'cross-fetch';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { transformClaudeToOpenAI, parseOpenAIResponse } from './src/utils/transform/claudeToOpenAI.js';

dotenv.config();

// 清除继承来的冲突环境变量，确保子进程（包括 CC）不会拿到脏的 env
delete process.env.ANTHROPIC_AUTH_TOKEN;

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3001;

// CC sends 32000 max_tokens by default (for Claude's 200K context).
// Most third-party models have smaller windows, so we cap output
// to a safe ceiling. Override with MAX_OUTPUT_TOKENS env var.
const MAX_OUTPUT_TOKENS = parseInt(process.env.MAX_OUTPUT_TOKENS) || 8192;

// 水印正则 — 匹配 [本地网关 — 实际模型: xxx]
const WATERMARK_RE = /\n*---\n\*\[本地网关 — 实际模型: .*?\]\*\n*/g;

/**
 * 递归剥离消息中的水印
 */
function stripWatermark(obj) {
  if (typeof obj === 'string') {
    return obj.replace(WATERMARK_RE, '');
  }
  if (Array.isArray(obj)) {
    return obj.map(stripWatermark);
  }
  if (obj && typeof obj === 'object') {
    const cleaned = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = stripWatermark(obj[key]);
    }
    return cleaned;
  }
  return obj;
}

/**
 * 从文本中提取 JSON 格式的函数调用，转为 tool_use 块。
 * 用于不原生支持 function calling 的模型——它们可能在文本里输出 JSON。
 */
function tryExtractToolCalls(text) {
  // 匹配 {"type": "function" 或 {"type":"function" 开头的 JSON 对象
  const re = /\{\s*"type"\s*:\s*"function"\s*,\s*"name"\s*:\s*"([^"]+)"\s*,\s*"parameters"\s*:\s*(\{[^}]*\})/g;
  const tools = [];
  let match;
  while ((match = re.exec(text)) !== null) {
    const name = match[1];
    let input = {};
    try {
      input = JSON.parse(match[2]);
    } catch {}
    tools.push({
      type: 'tool_use',
      id: `toolu_${Date.now()}_${tools.length}`,
      name,
      input,
    });
  }
  return tools.length > 0 ? tools : null;
}

let currentConfig = {
  apiUrl: process.env.TARGET_API_URL || '',
  apiKey: process.env.TARGET_API_KEY || '',
  model: process.env.DEFAULT_MODEL || '',
  toolsEnabled: true
};

/**
 * Parse an SSE (Server-Sent Events) streaming response body into a
 * single OpenAI-format JSON object by merging all chunks.
 */
function parseSSEToJSON(text) {
  const lines = text.split('\n');
  let merged = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith('data:')) continue;

    const jsonStr = trimmed.slice(5).trim();
    if (jsonStr === '[DONE]') continue;

    try {
      const chunk = JSON.parse(jsonStr);
      if (!merged) {
        merged = { ...chunk, object: 'chat.completion' };
        merged.choices = [{
          index: 0,
          message: { role: 'assistant', content: '' },
          finish_reason: null,
        }];
      }

      const delta = chunk.choices?.[0]?.delta;
      if (delta) {
        if (delta.content) {
          merged.choices[0].message.content += delta.content;
        }
        if (delta.role) {
          merged.choices[0].message.role = delta.role;
        }
        // Merge tool calls
        if (delta.tool_calls) {
          if (!merged.choices[0].message.tool_calls) {
            merged.choices[0].message.tool_calls = [];
          }
          for (const tc of delta.tool_calls) {
            const existing = merged.choices[0].message.tool_calls.find(t => t.index === tc.index);
            if (existing) {
              if (tc.function?.arguments) {
                existing.function.arguments += tc.function.arguments;
              }
              if (tc.function?.name) {
                existing.function.name += tc.function.name;
              }
            } else {
              merged.choices[0].message.tool_calls.push({
                index: tc.index,
                id: tc.id || '',
                type: 'function',
                function: {
                  name: tc.function?.name || '',
                  arguments: tc.function?.arguments || '',
                },
              });
            }
          }
        }
      }

      const finishReason = chunk.choices?.[0]?.finish_reason;
      if (finishReason) {
        merged.choices[0].finish_reason = finishReason;
      }
      if (chunk.usage) {
        merged.usage = chunk.usage;
      }
    } catch {
      // skip unparseable chunks
    }
  }

  return merged;
}

// ---- Config endpoints ----

app.post('/api/apply-config', (req, res) => {
  const { apiUrl, apiKey, model } = req.body;
  if (apiUrl) {
    if (!apiUrl.endsWith('/chat/completions')) {
      currentConfig.apiUrl = apiUrl.replace(/\/$/, '') + '/chat/completions';
    } else {
      currentConfig.apiUrl = apiUrl;
    }
  }
  if (apiKey) currentConfig.apiKey = apiKey;
  if (model) currentConfig.model = model;
  if (req.body.toolsEnabled !== undefined) currentConfig.toolsEnabled = req.body.toolsEnabled;

  console.log('[Proxy] 配置更新:');
  console.log(`  目标: ${currentConfig.apiUrl}`);
  console.log(`  模型: ${currentConfig.model}`);

  res.json({ success: true, message: '配置已更新' });
});

app.post('/api/launch-cc', (req, res) => {
  const { workDir } = req.body;

  const cmd = `start "Claude Code" cmd /k "chcp 65001 >nul && cls && echo =================================================== && echo   Claude Code 已链接至 API 网关！ && echo   当前模型: ${currentConfig.model} && echo =================================================== && set ANTHROPIC_BASE_URL=http://127.0.0.1:${PORT} && set ANTHROPIC_API_KEY=dummy && claude"`;

  const execOptions = {
    env: { ...process.env }
  };
  // 清除可能和代理冲突的环境变量
  delete execOptions.env.ANTHROPIC_AUTH_TOKEN;
  delete execOptions.env.ANTHROPIC_BASE_URL;
  delete execOptions.env.ANTHROPIC_MODEL;
  delete execOptions.env.ANTHROPIC_DEFAULT_HAIKU_MODEL;
  delete execOptions.env.ANTHROPIC_DEFAULT_SONNET_MODEL;
  delete execOptions.env.ANTHROPIC_DEFAULT_OPUS_MODEL;
  execOptions.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${PORT}`;
  execOptions.env.ANTHROPIC_API_KEY = 'dummy';

  if (workDir) execOptions.cwd = workDir;

  console.log('[Proxy] 正在拉起 Claude Code...');
  if (workDir) console.log(`  工作目录: ${workDir}`);
  exec(cmd, execOptions, (error) => {
    if (error) {
      console.error('启动 CC 失败:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    res.json({ success: true, message: 'CC 启动成功' });
  });
});

// ---- Anthropic API endpoints ----

app.get('/v1/models', (req, res) => {
  res.json({
    object: 'list',
    data: [
      { id: currentConfig.model, type: 'model', display_name: currentConfig.model, created_at: '2024-01-01T00:00:00Z' },
      { id: 'claude-sonnet-4-6', type: 'model', display_name: 'Claude Sonnet 4.6', created_at: '2024-01-01T00:00:00Z' },
      { id: 'claude-opus-4-7', type: 'model', display_name: 'Claude Opus 4.7', created_at: '2024-01-01T00:00:00Z' },
      { id: 'claude-haiku-4-5', type: 'model', display_name: 'Claude Haiku 4.5', created_at: '2024-01-01T00:00:00Z' },
    ],
  });
});

app.post('/v1/messages/count_tokens', async (req, res) => {
  if (!currentConfig.apiKey) {
    return res.status(401).json({
      type: 'error',
      error: { type: 'authentication_error', message: '代理网关未配置真实的 API Key' },
    });
  }

  try {
    const claudeRequest = req.body;
    const openAIRequest = transformClaudeToOpenAI(claudeRequest, { maxOutputTokens: MAX_OUTPUT_TOKENS });
    openAIRequest.model = currentConfig.model;
    openAIRequest.stream = false;

    const targetResponse = await fetch(currentConfig.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentConfig.apiKey}`,
      },
      body: JSON.stringify(openAIRequest),
    });

    if (!targetResponse.ok) {
      const errorText = await targetResponse.text();
      console.error('[Proxy] count_tokens 目标返回错误:', targetResponse.status, errorText);
      const estimatedTokens = JSON.stringify(claudeRequest.messages || []).length / 4;
      return res.json({ input_tokens: Math.max(1, Math.floor(estimatedTokens)) });
    }

    const responseData = await targetResponse.json();
    res.json({
      input_tokens: responseData.usage?.prompt_tokens || responseData.usage?.input_tokens || 0,
    });
  } catch (error) {
    console.error('[Proxy] count_tokens 出错:', error.message);
    // Fallback: rough estimate so CC doesn't break
    const estimated = Math.max(1, Math.floor(JSON.stringify(req.body.messages || []).length / 4));
    res.json({ input_tokens: estimated });
  }
});

app.post('/v1/messages', async (req, res) => {
  console.log('\n[Proxy] 收到 CC Messages 请求');

  if (!currentConfig.apiKey) {
    return res.status(401).json({
      type: 'error',
      error: { type: 'authentication_error', message: '代理网关未配置真实的 API Key，请在前端配置或在 .env 中设置 TARGET_API_KEY。' },
    });
  }

  try {
    const claudeRequest = req.body;
    const originalRequestedModel = claudeRequest.model;

    console.log(`[Proxy] 原模型: ${originalRequestedModel}, 消息数: ${(claudeRequest.messages || []).length}`);

    // 剥离历史消息中的水印，避免目标模型回传导致水印重复
    claudeRequest.messages = stripWatermark(claudeRequest.messages);

    // Transform Claude → OpenAI
    const openAIRequest = transformClaudeToOpenAI(claudeRequest, { maxOutputTokens: MAX_OUTPUT_TOKENS, toolsEnabled: currentConfig.toolsEnabled });
    openAIRequest.model = currentConfig.model;

    console.log(`[Proxy] 转发至: ${currentConfig.apiUrl}, 模型: ${currentConfig.model}, tools: ${currentConfig.toolsEnabled}, max_tokens: ${openAIRequest.max_tokens}`);

    const targetResponse = await fetch(currentConfig.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentConfig.apiKey}`,
      },
      body: JSON.stringify(openAIRequest),
    });

    if (!targetResponse.ok) {
      const errorText = await targetResponse.text();
      console.error('[Proxy] 目标 API 返回错误:', targetResponse.status, errorText);

      let errorMessage = `目标 API 返回 ${targetResponse.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
      } catch {}

      return res.status(targetResponse.status).json({
        type: 'error',
        error: { type: 'api_error', message: errorMessage },
      });
    }

    // Some APIs return SSE stream even when stream=false is set.
    // Detect and parse SSE into a single JSON object.
    const rawText = await targetResponse.text();
    let responseData;
    if (rawText.trimStart().startsWith('data:')) {
      console.log('[Proxy] 检测到 SSE 流式响应，正在合并...');
      responseData = parseSSEToJSON(rawText);
      if (!responseData) {
        return res.status(502).json({
          type: 'error',
          error: { type: 'api_error', message: '无法解析目标 SSE 响应' },
        });
      }
    } else {
      try {
        responseData = JSON.parse(rawText);
      } catch {
        console.error('[Proxy] 无法解析目标响应:', rawText.slice(0, 200));
        return res.status(502).json({
          type: 'error',
          error: { type: 'api_error', message: '目标返回了无法解析的响应格式' },
        });
      }
    }

    const claudeResponse = parseOpenAIResponse(responseData);
    claudeResponse.model = originalRequestedModel;

    // 如果目标模型不支持原生 function calling，尝试从文本中提取 JSON tool calls
    const hasToolUse = claudeResponse.content.some(c => c.type === 'tool_use');
    if (!hasToolUse) {
      for (let i = 0; i < claudeResponse.content.length; i++) {
        const block = claudeResponse.content[i];
        if (block.type === 'text' && /\{\s*"type"\s*:\s*"function"/.test(block.text)) {
          const extracted = tryExtractToolCalls(block.text);
          if (extracted) {
            const before = block.text.slice(0, block.text.indexOf('{"type"'));
            const after = block.text.slice(block.text.lastIndexOf('}') + 1);
            block.text = (before + after).trim();
            // 去掉可能残留的 trailing comma / whitespace
            claudeResponse.content.splice(i + 1, 0, ...extracted);
            break;
          }
        }
      }
    }

    // 先剥离响应中可能残留的旧水印，再加新水印
    claudeResponse.content = stripWatermark(claudeResponse.content);

    // Add watermark
    if (claudeResponse.content && claudeResponse.content.length > 0) {
      const lastBlock = claudeResponse.content[claudeResponse.content.length - 1];
      if (lastBlock.type === 'text') {
        lastBlock.text += `\n\n---\n*[本地网关 — 实际模型: ${currentConfig.model}]*`;
      }
    }

    res.json(claudeResponse);
  } catch (error) {
    console.error('[Proxy] 消息处理出错:', error);
    res.status(500).json({
      type: 'error',
      error: { type: 'api_error', message: error.message },
    });
  }
});

// ---- OpenAI-compatible endpoint (for Cursor, CodeX, etc.) ----

app.post('/v1/chat/completions', async (req, res) => {
  console.log('\n[Proxy] 收到 OpenAI 格式请求');

  if (!currentConfig.apiKey) {
    return res.status(401).json({ error: { message: '代理网关未配置真实的 API Key' } });
  }

  try {
    const openAIRequest = req.body;
    openAIRequest.model = currentConfig.model;
    openAIRequest.stream = false;

    console.log(`[Proxy] 转发至: ${currentConfig.apiUrl}, 模型: ${currentConfig.model}`);

    const targetResponse = await fetch(currentConfig.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentConfig.apiKey}`,
      },
      body: JSON.stringify(openAIRequest),
    });

    if (!targetResponse.ok) {
      const errorText = await targetResponse.text();
      console.error('[Proxy] 目标 API 错误:', targetResponse.status, errorText);
      return res.status(targetResponse.status).json({ error: errorText });
    }

    const rawText = await targetResponse.text();
    let responseData;
    if (rawText.trimStart().startsWith('data:')) {
      responseData = parseSSEToJSON(rawText);
      if (!responseData) {
        return res.status(502).json({ error: { message: '无法解析目标 SSE 响应' } });
      }
    } else {
      try {
        responseData = JSON.parse(rawText);
      } catch {
        return res.status(502).json({ error: { message: '目标返回了无法解析的响应格式' } });
      }
    }
    res.json(responseData);
  } catch (error) {
    console.error('[Proxy] 转发错误:', error);
    res.status(500).json({ error: { message: error.message } });
  }
});

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`API Proxy Server 已启动!`);
  console.log(`监听端口: ${PORT}`);
  console.log(`设置: ANTHROPIC_BASE_URL="http://127.0.0.1:${PORT}"`);
  console.log(`设置: ANTHROPIC_API_KEY="dummy"`);
  console.log('='.repeat(50));
});
