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
 * @param {string} text - 模型输出的文本
 * @param {Set<string>} [validToolNames] - 请求中实际声明的工具名称白名单，不在白名单中的 tool_use 会被丢弃
 * @param {number} [maxTools=5] - 单次响应最多提取的 tool_use 数量
 */
function tryExtractToolCalls(text, validToolNames, maxTools = 5) {
  // 匹配 {"type": "function" ... } 格式的 JSON 对象，支持嵌套 parameters
  // 先从文本中找到每个 {"type":"function" 的位置，再手动提取完整 JSON
  const tools = [];
  let searchFrom = 0;

  while (tools.length < maxTools) {
    const startMatch = /\{\s*"type"\s*:\s*"function"/g;
    startMatch.lastIndex = searchFrom;
    const sm = startMatch.exec(text);
    if (!sm) break;

    const objStart = sm.index;
    // 从 objStart 开始，找到匹配的 }
    let depth = 0;
    let objEnd = -1;
    for (let i = objStart; i < text.length; i++) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') {
        depth--;
        if (depth === 0) { objEnd = i; break; }
      }
    }
    if (objEnd === -1) break;

    const jsonStr = text.slice(objStart, objEnd + 1);
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.type === 'function' && parsed.name) {
        const name = parsed.name;
        // 白名单验证：只接受请求中实际声明的工具
        if (validToolNames && !validToolNames.has(name)) {
          searchFrom = objEnd + 1;
          continue;
        }
        tools.push({
          type: 'tool_use',
          id: `toolu_${Date.now()}_${tools.length}`,
          name,
          input: parsed.parameters || {},
        });
      }
    } catch {
      // JSON 解析失败，跳过继续搜索
    }
    searchFrom = objEnd + 1;
  }

  return tools.length > 0 ? tools : null;
}

/**
 * 从文本中移除 {"type":"function",...} 格式的 JSON tool call 片段。
 * 用括号深度计数正确匹配嵌套对象。
 */
function stripToolCallJSON(text) {
  const re = /\{\s*"type"\s*:\s*"function"/g;
  let result = '';
  let lastEnd = 0;
  let match;

  while ((match = re.exec(text)) !== null) {
    const objStart = match.index;
    // 从 objStart 开始找匹配的 }
    let depth = 0;
    let objEnd = -1;
    for (let i = objStart; i < text.length; i++) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') {
        depth--;
        if (depth === 0) { objEnd = i; break; }
      }
    }
    if (objEnd === -1) break;

    // 拷贝 objStart 之前的文本
    result += text.slice(lastEnd, objStart);
    // 跳过这个 JSON 对象及后面的逗号/空白
    lastEnd = objEnd + 1;
    while (lastEnd < text.length && (text[lastEnd] === ',' || text[lastEnd] === ' ' || text[lastEnd] === '\n')) {
      lastEnd++;
    }
  }
  result += text.slice(lastEnd);
  return result.replace(/,\s*,/g, ',').replace(/^\s*,\s*/, '').trim();
}

// 存储原始 tool schema，用于响应阶段重建拍平后的参数
const originalToolSchemas = new Map();

/**
 * 递归拍平 tool schema：将嵌套 object 和 array<object> 替换为 JSON string。
 * 非 Claude 模型（Nemotron 等）填不对嵌套结构，JSON 字符串更可靠。
 * AskUserQuestion 例外：用 flat 字段（比 JSON string 更好用）。
 */
function flattenSchema(schema) {
  if (!schema || schema.type !== 'object' || !schema.properties) return schema;
  const flat = {};
  for (const [key, prop] of Object.entries(schema.properties)) {
    if (prop.type === 'array' && prop.items && (prop.items.type === 'object' || (prop.items.type === 'array' && prop.items.items?.type === 'object'))) {
      flat[key] = { type: 'string', description: (prop.description || key) + ' — JSON array string, e.g. [{"k":"v"}]' };
    } else if (prop.type === 'object' && prop.properties) {
      flat[key] = { type: 'string', description: (prop.description || key) + ' — JSON object string, e.g. {"k":"v"}' };
    } else if (prop.type === 'array' && prop.items?.type === 'object') {
      flat[key] = { type: 'string', description: (prop.description || key) + ' — JSON array string, e.g. [{"k":"v"}]' };
    } else {
      flat[key] = prop;
    }
  }
  return { type: 'object', properties: flat, required: schema.required };
}

/**
 * 对 AskUserQuestion 用 flat 字段拍平（比 JSON string 更友好）
 */
function flattenAskUserQuestion(tool) {
  tool.function.parameters = {
    type: 'object',
    properties: {
      question: { type: 'string', description: 'The question to ask the user' },
      option1: { type: 'string', description: 'First option for the user to choose' },
      option2: { type: 'string', description: 'Second option (optional)' },
      option3: { type: 'string', description: 'Third option (optional)' },
      option4: { type: 'string', description: 'Fourth option (optional)' },
    },
    required: ['question', 'option1'],
  };
  return tool;
}

/**
 * 重建 AskUserQuestion 的 flat 格式回 CC 嵌套格式
 */
function reconstructAskUserQuestion(input) {
  if (!input || !input.question) return input;
  const options = [];
  for (let i = 1; i <= 4; i++) {
    const label = input[`option${i}`];
    if (label && label.trim()) {
      options.push({ label: label.trim(), description: label.trim() });
    }
  }
  if (options.length === 0) {
    options.push({ label: 'Continue', description: 'Continue with the task' });
  }
  return {
    questions: [{ question: input.question, header: input.question.slice(0, 12), options, multiSelect: false }],
  };
}

/**
 * 拍平请求中所有 tool 的 schema，保存原始 schema 用于响应重建
 */
function flattenAllToolSchemas(tools) {
  if (!tools) return tools;
  return tools.map(tool => {
    const name = tool.function.name;
    // 保存原始 schema
    if (!originalToolSchemas.has(name)) {
      originalToolSchemas.set(name, JSON.parse(JSON.stringify(tool.function.parameters)));
    }
    // AskUserQuestion 用专用拍平
    if (name === 'AskUserQuestion') {
      return flattenAskUserQuestion(JSON.parse(JSON.stringify(tool)));
    }
    // 其他工具用通用递归拍平
    const flattened = JSON.parse(JSON.stringify(tool));
    flattened.function.parameters = flattenSchema(tool.function.parameters);
    return flattened;
  });
}

/**
 * 根据原始 schema 重建被拍平的 tool_use input
 */
function reconstructToolCallInput(name, input) {
  if (!input) return input;
  // AskUserQuestion 用专用重建
  if (name === 'AskUserQuestion') {
    return reconstructAskUserQuestion(input);
  }
  // 通用重建：查原始 schema，parse 被拍平为 JSON string 的字段
  const origSchema = originalToolSchemas.get(name);
  if (!origSchema || !origSchema.properties) return input;
  const reconstructed = { ...input };
  for (const [key, prop] of Object.entries(origSchema.properties)) {
    if (typeof reconstructed[key] === 'string') {
      if (prop.type === 'array' || prop.type === 'object') {
        try { reconstructed[key] = JSON.parse(reconstructed[key]); } catch { /* keep original string */ }
      }
    }
  }
  return reconstructed;
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

/**
 * Write a single SSE event to the response.
 */
function writeSSE(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Serialize a Claude/Anthropic response into SSE streaming events and write to the response.
 * This gives CC the streaming format it expects for real-time display.
 */
function writeClaudeResponseAsSSE(res, claudeResponse) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const messageId = claudeResponse.id || `msg_${Date.now()}`;

  // message_start
  writeSSE(res, 'message_start', {
    type: 'message_start',
    message: {
      id: messageId,
      type: 'message',
      role: 'assistant',
      model: claudeResponse.model,
      content: [],
      stop_reason: null,
      stop_sequence: null,
      usage: { input_tokens: claudeResponse.usage?.input_tokens || 0, output_tokens: 0 },
    },
  });

  // content blocks
  for (let i = 0; i < claudeResponse.content.length; i++) {
    const block = claudeResponse.content[i];
    if (block.type === 'text') {
      writeSSE(res, 'content_block_start', {
        type: 'content_block_start',
        index: i,
        content_block: { type: 'text', text: '' },
      });
      writeSSE(res, 'content_block_delta', {
        type: 'content_block_delta',
        index: i,
        delta: { type: 'text_delta', text: block.text },
      });
      writeSSE(res, 'content_block_stop', {
        type: 'content_block_stop',
        index: i,
      });
    } else if (block.type === 'tool_use') {
      writeSSE(res, 'content_block_start', {
        type: 'content_block_start',
        index: i,
        content_block: { type: 'tool_use', id: block.id, name: block.name, input: {} },
      });
      const inputJson = JSON.stringify(block.input || {});
      writeSSE(res, 'content_block_delta', {
        type: 'content_block_delta',
        index: i,
        delta: { type: 'input_json_delta', partial_json: inputJson },
      });
      writeSSE(res, 'content_block_stop', {
        type: 'content_block_stop',
        index: i,
      });
    }
  }

  // message_delta
  writeSSE(res, 'message_delta', {
    type: 'message_delta',
    delta: { stop_reason: claudeResponse.stop_reason || 'end_turn' },
    usage: { output_tokens: claudeResponse.usage?.output_tokens || 0 },
  });

  // message_stop
  writeSSE(res, 'message_stop', { type: 'message_stop' });
  res.end();
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
  console.log(`  工具调用: ${currentConfig.toolsEnabled ? '启用' : '禁用'}`);

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

    // 在系统提示最前面注入工具使用规范，防止非 Claude 模型（如 Llama）在闲聊/问候时误调工具
    const TOOL_USE_GUARD = `[TOOL USE GUIDELINES]
You have access to tools. Follow these rules:

SKIP TOOLS — reply in plain text:
- Pure greetings (你好, hello, hi)
- "Who are you" / identity questions
- Casual chit-chat with no task implied

USE TOOLS — when the user wants you to DO something:
- Read/write files → Read, Write, Edit
- Run commands → Bash
- Search code → Grep, Glob
- Launch sub-agents for complex work → Agent
- Ask the user to clarify vague requests → AskUserQuestion
- Any other concrete action → use the right tool

When a request is vague (like "look at my project"), DO NOT guess — use AskUserQuestion to narrow it down. That IS a task, not chit-chat.

`;

    if (typeof claudeRequest.system === 'string') {
      claudeRequest.system = TOOL_USE_GUARD + claudeRequest.system;
    } else if (Array.isArray(claudeRequest.system)) {
      claudeRequest.system.unshift({ type: 'text', text: TOOL_USE_GUARD });
    } else {
      claudeRequest.system = TOOL_USE_GUARD;
    }

    // Transform Claude → OpenAI
    const openAIRequest = transformClaudeToOpenAI(claudeRequest, { maxOutputTokens: MAX_OUTPUT_TOKENS, toolsEnabled: currentConfig.toolsEnabled });
    openAIRequest.model = currentConfig.model;

    // 简化复杂 tool schema（如 AskUserQuestion 的嵌套数组），让非 Claude 模型能正确填写参数
    if (openAIRequest.tools) {
      openAIRequest.tools = flattenAllToolSchemas(openAIRequest.tools);
    }

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

    // 将拍平的 tool_use input 重建为 CC 期望的原始嵌套格式
    for (const block of claudeResponse.content) {
      if (block.type === 'tool_use') {
        const before = JSON.stringify(block.input);
        block.input = reconstructToolCallInput(block.name, block.input);
        const after = JSON.stringify(block.input);
        if (before !== after) {
          console.log(`[Proxy] 重建 ${block.name}: ${after.slice(0,200)}`);
        }
      }
    }

    // 检测响应中是否有原生 tool_use（上游 API 原生返回的 tool_calls）
    const hasToolUse = claudeResponse.content.some(c => c.type === 'tool_use');

    // 响应阶段安全网：过滤明显是模型误生成的 tool_use（input 全空/无意义）
    // 合法的工具调用（有实质性参数）正常放行
    if (hasToolUse) {
      claudeResponse.content = claudeResponse.content.filter(c => {
        if (c.type !== 'tool_use') return true;
        // 保留有实质 input 的 tool_use
        const input = c.input || {};
        const inputValues = Object.values(input).filter(v => v !== '' && v !== null && v !== undefined);
        const isEmpty = inputValues.length === 0;
        if (!isEmpty) return true;
        // 工具本身无必要参数（如 EnterPlanMode）时，{} 是合法的，不放过滤
        const origSchema = originalToolSchemas.get(c.name);
        const hasRequiredParams = origSchema?.required?.length > 0;
        if (!hasRequiredParams) return true;
        console.log(`[Proxy] 过滤空 tool_use: ${c.name}`);
        return false;
      });
    }

    // 清理文本中残留的 JSON tool call 片段（{"type":"function"...}），
    // 用括号深度计数正确匹配嵌套 JSON 对象
    for (const block of claudeResponse.content) {
      if (block.type === 'text') {
        block.text = stripToolCallJSON(block.text);
      }
    }

    // 移除清理后变为空的文本块
    claudeResponse.content = claudeResponse.content.filter(c => {
      if (c.type === 'text' && c.text.trim() === '') return false;
      return true;
    });

    // 如果过滤掉了所有内容，补空文本块（CC 需要至少一个 content block）
    if (claudeResponse.content.length === 0) {
      claudeResponse.content.push({ type: 'text', text: '' });
    }

    // 如果没有原生 tool_use，尝试从文本中提取 JSON tool calls（用于不支持 function calling 的模型）
    if (!hasToolUse && currentConfig.toolsEnabled) {
      // 收集请求中的工具名称作为白名单
      const validToolNames = new Set(
        (claudeRequest.tools || []).map(t => t.name).filter(Boolean)
      );
      for (let i = 0; i < claudeResponse.content.length; i++) {
        const block = claudeResponse.content[i];
        if (block.type === 'text' && /\{\s*"type"\s*:\s*"function"/.test(block.text)) {
          const extracted = tryExtractToolCalls(block.text, validToolNames);
          if (extracted) {
            // 清理文本中的 JSON tool call 残留
            let cleanedText = block.text;
            for (const tool of extracted) {
              // 移除已提取的 tool call JSON 块
              const toolJson = JSON.stringify({ type: 'function', name: tool.name, parameters: tool.input });
              cleanedText = cleanedText.replace(toolJson, '');
            }
            // 清理可能残留的逗号、空白
            cleanedText = cleanedText.replace(/,\s*,/g, ',').replace(/\[\s*\]/g, '').replace(/\{\s*\}/g, '').trim();
            block.text = cleanedText || '';
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

    // 如果 CC 请求了流式响应，以 Anthropic SSE 格式返回；否则返回 JSON
    if (claudeRequest.stream) {
      console.log('[Proxy] 以 SSE 流式格式返回响应');
      writeClaudeResponseAsSSE(res, claudeResponse);
    } else {
      res.json(claudeResponse);
    }
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
    // 保留客户端的 stream 偏好，不再强制禁用
    const clientWantsStream = openAIRequest.stream === true;

    console.log(`[Proxy] 转发至: ${currentConfig.apiUrl}, 模型: ${currentConfig.model}, stream: ${!!clientWantsStream}`);

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

    // 读取上游响应（可能是 SSE 流或 JSON）
    const rawText = await targetResponse.text();
    const isSSE = rawText.trimStart().startsWith('data:');

    // 如果客户端请求了流式且上游返回了 SSE，直接透传 SSE 响应
    if (clientWantsStream && isSSE) {
      console.log('[Proxy] 流式透传 SSE 响应');
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(rawText);
      if (!rawText.endsWith('data: [DONE]\n\n') && !rawText.includes('data: [DONE]')) {
        res.write('data: [DONE]\n\n');
      }
      return res.end();
    }

    // 非流式或上游返回了 JSON：缓冲后返回 JSON
    let responseData;
    if (isSSE) {
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
  console.log(`工具调用: ${currentConfig.toolsEnabled ? '启用' : '禁用'}`);
  console.log(`设置: ANTHROPIC_BASE_URL="http://127.0.0.1:${PORT}"`);
  console.log(`设置: ANTHROPIC_API_KEY="dummy"`);
  console.log('='.repeat(50));
});
