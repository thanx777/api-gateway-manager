/**
 * Convert a single Anthropic content block (text, tool_use, etc.) to a string.
 */
function contentBlockToString(block) {
  if (typeof block === 'string') return block;
  if (block.type === 'text') return block.text;
  if (block.type === 'tool_use') {
    return JSON.stringify({ tool_use: { name: block.name, id: block.id, input: block.input } });
  }
  if (block.type === 'tool_result') {
    const content = typeof block.content === 'string' ? block.content : block.content?.map(contentBlockToString).join('\n') || '';
    return `<tool_result tool_use_id="${block.tool_use_id}">\n${content}\n</tool_result>`;
  }
  return JSON.stringify(block);
}

/**
 * Normalize Anthropic message content to a string.
 */
function normalizeContent(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map(contentBlockToString).join('\n');
  }
  return String(content || '');
}

/**
 * Convert Anthropic messages to OpenAI-compatible messages.
 * Handles tool_use → tool_calls and tool_result → tool role.
 */
function convertMessages(anthropicMessages) {
  const openaiMessages = [];
  const pendingToolCalls = [];

  for (const msg of anthropicMessages) {
    const role = msg.role;
    const content = msg.content;

    if (role === 'assistant' && Array.isArray(content)) {
      const textParts = [];
      const toolUses = [];

      for (const block of content) {
        if (block.type === 'text') {
          textParts.push(block.text);
        } else if (block.type === 'tool_use') {
          toolUses.push({
            id: block.id,
            type: 'function',
            function: {
              name: block.name,
              arguments: typeof block.input === 'string' ? block.input : JSON.stringify(block.input),
            },
          });
        }
      }

      const textContent = textParts.join('\n') || null;

      if (toolUses.length > 0) {
        openaiMessages.push({
          role: 'assistant',
          content: textContent,
          tool_calls: toolUses,
        });
        // Track for matching tool results
        for (const tc of toolUses) {
          pendingToolCalls.push(tc.id);
        }
      } else if (textContent) {
        openaiMessages.push({ role: 'assistant', content: textContent });
      }
    } else if (role === 'user' && Array.isArray(content)) {
      // Check for tool_result blocks
      const textParts = [];
      const toolResults = [];

      for (const block of content) {
        if (block.type === 'tool_result') {
          const resultText = typeof block.content === 'string'
            ? block.content
            : Array.isArray(block.content)
              ? block.content.map(contentBlockToString).join('\n')
              : '';
          toolResults.push({ tool_call_id: block.tool_use_id, content: resultText });
        } else if (block.type === 'text') {
          textParts.push(block.text);
        }
      }

      // Emit tool result messages first
      for (const tr of toolResults) {
        openaiMessages.push({ role: 'tool', tool_call_id: tr.tool_call_id, content: tr.content });
      }
      // Then emit user text if any
      if (textParts.length > 0) {
        openaiMessages.push({ role: 'user', content: textParts.join('\n') });
      }
      if (textParts.length === 0 && toolResults.length === 0) {
        openaiMessages.push({ role: 'user', content: normalizeContent(content) });
      }
    } else {
      openaiMessages.push({ role, content: normalizeContent(content) });
    }
  }

  return openaiMessages;
}

/**
 * Convert a Claude/Anthropic Messages API request to OpenAI Chat Completions format.
 */
export function transformClaudeToOpenAI(request, options = {}) {
  let maxTokens = request.max_tokens || 4096;

  // CC sends 32000 max_tokens by default (for Claude's 200K context).
  // Most third-party models have 8K-32K windows and can't handle
  // that much output. Cap to a safe ceiling — prefer env override.
  const outputCap = options.maxOutputTokens || 8192;
  if (maxTokens > outputCap) {
    maxTokens = outputCap;
  }

  const transformed = {
    model: request.model,
    messages: convertMessages(request.messages || []),
    max_tokens: maxTokens,
    temperature: request.temperature !== undefined ? request.temperature : 1.0,
  };

  if (request.top_p !== undefined) {
    transformed.top_p = request.top_p;
  }
  if (request.top_k !== undefined) {
    transformed.top_k = request.top_k;
  }
  if (request.stream !== undefined) {
    transformed.stream = request.stream;
  }
  if (request.stop_sequences) {
    transformed.stop = request.stop_sequences;
  }

  // Handle system prompt (string or array)
  if (request.system) {
    let systemText;
    if (typeof request.system === 'string') {
      systemText = request.system;
    } else if (Array.isArray(request.system)) {
      systemText = request.system
        .map(b => (b.type === 'text' ? b.text : ''))
        .filter(Boolean)
        .join('\n');
    }
    if (systemText) {
      transformed.messages.unshift({ role: 'system', content: systemText });
    }
  }

  // Tool handling: many free-tier APIs (NVIDIA NIM, etc.) don't support
  // native function calling. When tools are present, some proxies return:
  // "auto" tool choice requires --enable-auto-tool-choice.
  // We strip tools by default so CC falls back to parsing tool calls from
  // text output, which works with any model that can follow instructions.
  // To enable native tools on supported providers, set TOOLS_ENABLED=true in .env
  if (request.tools && request.tools.length > 0 && options.toolsEnabled !== false) {
    transformed.tools = request.tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description || '',
        parameters: tool.input_schema || {},
      },
    }));
    // Convert Anthropic tool_choice format to OpenAI
    if (request.tool_choice) {
      if (typeof request.tool_choice === 'string') {
        transformed.tool_choice = request.tool_choice;
      } else if (request.tool_choice.type === 'auto') {
        transformed.tool_choice = 'auto';
      } else if (request.tool_choice.type === 'any') {
        transformed.tool_choice = 'required';
      } else if (request.tool_choice.type === 'tool') {
        transformed.tool_choice = {
          type: 'function',
          function: { name: request.tool_choice.name },
        };
      }
    }
  }

  return transformed;
}

/**
 * Parse an OpenAI Chat Completions response into Anthropic Messages format.
 */
export function parseOpenAIResponse(response) {
  const choice = response.choices?.[0];
  const message = choice?.message || {};
  const content = [];

  // Handle text content
  if (message.content) {
    content.push({ type: 'text', text: message.content });
  }

  // Handle tool_calls in response
  if (message.tool_calls && message.tool_calls.length > 0) {
    for (const tc of message.tool_calls) {
      let input;
      try {
        input = typeof tc.function.arguments === 'string'
          ? JSON.parse(tc.function.arguments)
          : tc.function.arguments;
      } catch {
        input = {};
      }
      content.push({
        type: 'tool_use',
        id: tc.id,
        name: tc.function.name,
        input,
      });
    }
  }

  // If no content at all, add empty text
  if (content.length === 0) {
    content.push({ type: 'text', text: '' });
  }

  return {
    id: response.id || `msg_${Date.now()}`,
    type: 'message',
    role: 'assistant',
    model: response.model || 'unknown',
    content,
    stop_reason: choice?.finish_reason === 'tool_calls' ? 'tool_use' : (choice?.finish_reason || 'end_turn'),
    stop_sequence: null,
    usage: {
      input_tokens: response.usage?.prompt_tokens || 0,
      output_tokens: response.usage?.completion_tokens || 0,
    },
  };
}
