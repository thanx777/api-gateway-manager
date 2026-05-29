---
name: tool-calling-non-claude-models
description: 非 Claude 模型通过网关的工具调用陷阱 — 响应阶段也必须过滤
metadata:
  type: project
---

当目标模型（如 llama-4-maverick）通过 API 网关代理 CC 请求时，即使 `toolsEnabled=false` 且工具定义已从请求中剥离，上游 API 仍可能**原生返回 tool_calls**——因为模型在对话历史中看到过 tool_use/tool_result，学会了模仿。`parseOpenAIResponse()` 会将它们转为 tool_use 内容块，绕过请求阶段的工具剥离。

**Why:** 两阶段过滤缺一不可：
1. 请求阶段：`toolsEnabled=false` → 剥离 tools 定义 + 注入 system hint
2. 响应阶段：`toolsEnabled=false` → 强制过滤 `claudeResponse.content` 中的 tool_use 块，并正则清理文本中的 JSON tool call 残留

**How to apply:** 在 `server.js` 的 `/v1/messages` 处理中，`parseOpenAIResponse` 之后加入：
```js
if (!currentConfig.toolsEnabled) {
  claudeResponse.content = claudeResponse.content.filter(c => c.type !== 'tool_use');
  for (const block of claudeResponse.content) {
    if (block.type === 'text') {
      block.text = block.text.replace(/\{\s*"type"\s*:\s*"function"[^}]*\}[,\s]*/g, '');
    }
  }
}
```

同时注意：前端 `/api/apply-config` 会覆盖服务端默认值，旧 localStorage 配置中的 `toolsEnabled: true` 会重新启用工具。重启服务后如果还通过前端"拉起 CC"，需先编辑配置取消勾选"启用工具调用"，或直接手动启动 CC 使用服务端默认值。
