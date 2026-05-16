/**
 * Convert OpenAI Chat Completions request to Anthropic Messages API format.
 */
export function transformOpenAIToClaude(request) {
  const messages = [];
  let system = null;

  for (const msg of request.messages || []) {
    if (msg.role === 'system') {
      system = msg.content;
    } else if (msg.role === 'tool') {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: msg.tool_call_id,
            content: msg.content,
          },
        ],
      });
    } else if (msg.role === 'assistant' && msg.tool_calls) {
      const content = [];
      if (msg.content) {
        content.push({ type: 'text', text: msg.content });
      }
      for (const tc of msg.tool_calls) {
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
      messages.push({ role: 'assistant', content });
    } else {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  const transformed = {
    model: request.model,
    messages,
    max_tokens: request.max_tokens || 4096,
    temperature: request.temperature !== undefined ? request.temperature : 1.0,
  };

  if (system) {
    transformed.system = system;
  }
  if (request.top_p !== undefined) {
    transformed.top_p = request.top_p;
  }
  if (request.stream !== undefined) {
    transformed.stream = request.stream;
  }
  if (request.stop) {
    transformed.stop_sequences = Array.isArray(request.stop) ? request.stop : [request.stop];
  }
  if (request.tools) {
    transformed.tools = request.tools.map(tool => ({
      name: tool.function.name,
      description: tool.function.description || '',
      input_schema: tool.function.parameters || {},
    }));
  }

  return transformed;
}

/**
 * Parse an Anthropic Messages API response into OpenAI Chat Completions format.
 */
export function parseClaudeResponse(response) {
  const content = response.content || [];
  let textContent = '';
  const toolCalls = [];

  for (const block of content) {
    if (block.type === 'text') {
      textContent += (textContent ? '\n' : '') + block.text;
    } else if (block.type === 'tool_use') {
      toolCalls.push({
        id: block.id,
        type: 'function',
        function: {
          name: block.name,
          arguments: JSON.stringify(block.input),
        },
      });
    }
  }

  return {
    id: response.id,
    object: 'chat.completion',
    model: response.model,
    created: Math.floor(Date.now() / 1000),
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: textContent || null,
          ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
        },
        finish_reason: response.stop_reason === 'tool_use' ? 'tool_calls' : (response.stop_reason || 'stop'),
      },
    ],
    usage: {
      prompt_tokens: response.usage?.input_tokens || 0,
      completion_tokens: response.usage?.output_tokens || 0,
      total_tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
    },
  };
}
