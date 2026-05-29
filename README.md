# API Gateway Manager

<p align="center">
  <strong>一站式 AI API 网关管理与代理工具</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-%3E%3D18-green" alt="Node.js">
  <img src="https://img.shields.io/badge/React-18-blue" alt="React">
  <img src="https://img.shields.io/badge/Vite-5-purple" alt="Vite">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>

一个现代化的 API 管理与底层代理工具，支持统管配置多种 AI 服务提供商的模型和 API 密钥，实现多协议无缝转化，包含真实底层接口代理及可视化管理面板。让 Claude Code、Cursor、CodeX 等工具直接使用任意大模型后端。

---

## ✨ 核心功能

### 🎛️ API 集中配置管理

- 可视化前端面板统一管理：添加、编辑、删除 API 配置
- 支持 **13+** 种 AI 服务提供商，覆盖国内外主流模型：

| 供应商 | 类型 | 默认模型 |
|--------|------|----------|
| 🤖 OpenAI | OpenAI 兼容 | gpt-4-turbo |
| ✨ Claude (Anthropic) | Anthropic 专有 | claude-3.5-sonnet |
| ⚡ DeepSeek | OpenAI 兼容 | deepseek-chat |
| 🧠 GLM (智谱) | OpenAI 兼容 | glm-4 |
| � NVIDIA NIM | OpenAI 兼容 | mixtral-8x7b |
| 🔵 Qwen (通义千问) | OpenAI 兼容 | qwen-plus |
| 🩷 Doubao (豆包) | OpenAI 兼容 | ep-20240516xxxx |
| 🟡 Minimax | OpenAI 兼容 | abab6.5-chat |
| 🟣 Moonshot (月之暗面) | OpenAI 兼容 | moonshot-v1-8k |
| 🟠 Groq | OpenAI 兼容 | llama-3.1-70b-versatile |
| 🔵 Ollama (本地) | OpenAI 兼容 | llama2 |
| 🟣 OpenRouter | OpenAI 兼容 | claude-3.5-sonnet |
| 🟢 Cohere | OpenAI 兼容 | command-r-plus |

### 🔄 多协议转换引擎

- **Claude ↔ OpenAI** 双向协议转换
- 同一格式类别（OpenAI 兼容）之间直接互转
- 自动处理消息格式、工具调用（Tool Use）、token 计数等差异
- **通用 Tool Schema 拍平**：对嵌套对象/数组 schema 自动拍平为 JSON 字符串，让非 Claude 模型（Nemotron 等）也能正确填写工具参数；响应阶段按原始 schema 自动重建为 CC 期望格式
- **工具调用防护**：在系统提示开头注入规范（问候/闲聊 → 纯文本，模糊请求 → `AskUserQuestion` 澄清），防止模型误调工具
- **智能空调用过滤**：过滤 input 为空的多余 tool_use，但保留无参工具（如 `EnterPlanMode`）的合法空参数
- **SSE 流式响应**：自动将上游 SSE 流转换为 Anthropic SSE 格式，让 CC 获得逐字输出效果

### 🌐 本地代理引擎

- 本地常驻代理服务（Node.js Express），监听 `localhost:3001`
- 完整实现 Anthropic Messages API (`/v1/messages`)，让 Claude Code 透明对接任意模型
- 兼容 OpenAI Chat Completions API (`/v1/chat/completions`)，支持 Cursor / CodeX / Continue 等工具
- 自动 `max_tokens` 截断保护（默认 8192，防止第三方模型报错）
- 一键拉起 Claude Code，自动注入环境变量，支持指定工作目录
- **模型选择建议**：推荐 NVIDIA 的 Nemotron 系列（如 `nvidia/llama-3.3-nemotron-super-49b-v1.5`），专为 agentic 任务和工具调用后训练，与 CC 兼容性最好。避免 Llama-4-Maverick（乱调工具）、Qwen（prompt template 冲突）

### 🧪 API 可视化调试器

- 直观可视化前端操作，一键生成符合不同大模型标准的请求参数
- 实时预览转换结果，对比请求与响应差异
- 支持在线测试 API 连通性

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18
- **npm** >= 9
- **Windows** 操作系统（`start.bat` 一键启动）

### 方式一：一键启动（推荐）

**第一步：双击 `start.bat`**

在项目根目录找到并双击运行 `start.bat`：
- 首次运行会自动安装依赖
- 自动启动两个服务：前端管理面板 + 底层代理网关

**第二步：配置 API**

浏览器访问 `http://localhost:3000`，在左侧菜单【API 配置管理】中添加你的大模型连接地址、API Key 和模型名称。

**第三步：使用**

- **Claude Code 用户**：在 API 卡片右上角点击 **[拉起 CC]** 按钮，系统自动拉起终端并注入环境变量，开箱即用
- **指定工作目录**：在 API 配置中添加"工作目录"，拉起 CC 后终端将在该目录下启动。留空则默认使用当前项目目录
- **Cursor / CodeX / Continue 用户**：在 IDE 插件的 "Custom Model / Base URL" 中填写 `http://localhost:3001/v1`

### 方式二：手动启动

```bash
# 安装依赖
npm install

# 终端 1：启动前端
npm run dev

# 终端 2：启动代理服务
node server.js
```

### 环境变量配置

复制 `.env.example` 为 `.env`，按需修改：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 代理服务端口 | 3001 |
| `TARGET_API_URL` | 目标 API 地址（可通过 UI 覆盖） | - |
| `TARGET_API_KEY` | 目标 API 密钥（可通过 UI 覆盖） | - |
| `DEFAULT_MODEL` | 默认模型（可通过 UI 覆盖） | - |
| `MAX_OUTPUT_TOKENS` | 输出 token 上限 | 8192 |

> 💡 环境变量仅为初始默认值，所有配置均可通过前端 UI 动态修改，无需重启服务。
>
> 🔧 **工具调用**：在前端 API 配置表单中通过"启用工具调用"复选框按配置独立控制。开启后代理会自动注入工具使用规范（防乱调）+ Schema 拍平（保参数正确）+ 空调用过滤（去噪音）。推荐搭配 Nemotron 系列模型使用。

---

## 🏗️ 项目架构

```
api-gateway-manager/
├── server.js                    # 本地代理网关服务 (Express)
├── src/
│   ├── App.jsx                  # React 应用入口 & 路由
│   ├── main.jsx                 # Vite 入口
│   ├── pages/
│   │   ├── Dashboard.jsx        # 仪表盘首页
│   │   ├── APIConfigManager.jsx # API 配置管理页
│   │   ├── APITransformer.jsx   # 协议转换器页
│   │   ├── APITester.jsx        # API 测试页
│   │   └── UsageGuide.jsx       # 使用指南页
│   ├── components/
│   │   ├── api-config/          # API 配置相关组件
│   │   │   ├── APIConfigCard.jsx
│   │   │   ├── APIConfigForm.jsx
│   │   │   ├── APIConfigList.jsx
│   │   │   └── ProviderBadge.jsx  # 供应商配置 & 图标
│   │   ├── common/              # 通用 UI 组件
│   │   ├── layout/              # 布局组件
│   │   ├── tester/              # 测试控制台组件
│   │   └── transformer/         # 转换面板组件
│   ├── context/
│   │   ├── APIConfigContext.jsx  # API 配置状态管理
│   │   └── TransformContext.jsx  # 转换状态管理
│   └── utils/
│       └── transform/
│           ├── transformEngine.js    # 转换调度引擎
│           ├── claudeToOpenAI.js     # Claude → OpenAI 转换
│           └── openaiToClaude.js     # OpenAI → Claude 转换
├── start.bat                    # Windows 一键启动脚本
├── restart.bat                  # 重启脚本（杀旧进程后重启）
├── .env.example                 # 环境变量模板
├── vite.config.js               # Vite 构建配置
├── tailwind.config.js           # Tailwind CSS 配置
└── package.json
```

---

## 🔧 工作原理

```
┌─────────────────┐     ┌──────────────────────────┐     ┌──────────────────┐
│  Claude Code    │────▶│  本地代理网关 (localhost:3001) │────▶│  目标 AI 服务    │
│  Cursor / CodeX │     │                            │     │  (NVIDIA NIM等)  │
└─────────────────┘     │  ┌──────────────────────┐  │     └──────────────────┘
                        │  │ Claude ↔ OpenAI 转换   │  │
                        │  │ Tool Schema 拍平/重建  │  │
                        │  │ 工具调用防护注入       │  │
                        │  │ SSE 流式转换           │  │
                        │  │ max_tokens 截断        │  │
                        │  │ 空 tool_use 智能过滤   │  │
                        │  │ 水印注入               │  │
                        │  └──────────────────────┘  │
                        └──────────────────────────┘
                                   ▲
                                   │ 配置下发
                        ┌──────────────────────────┐
                        │  前端管理面板 (localhost:3000) │
                        │  可视化配置 / 调试 / 转换    │
                        └──────────────────────────┘
```

1. **Claude Code** 发送 Anthropic 格式请求到本地代理
2. 代理将请求 **转换** 为目标模型的 OpenAI 兼容格式
3. 转发到目标 AI 服务，接收响应
4. 将响应 **反转换** 为 Anthropic 格式返回给 Claude Code
5. 前端管理面板提供可视化配置和调试能力

> ⚠️ **配置优先级**：Claude Code 加载配置的顺序为 `~\.claude\settings.json`（用户级）→ `.claude\settings.json`（项目级）→ CMD 环境变量，**用户级优先级最高**。启动 CC 前请确保用户级配置不会覆盖代理的环境变量，详见 [常见问题](#常见问题)。

---

## ⚠️ 常见问题

### 拉起 CC 后显示的不是代理模型？

**现象**：CC 界面显示 `deepseek-v4-pro` 等非代理模型名，请求没有经过代理，也无 watermark。

**根因**：Claude Code 配置优先级 `~/.claude/settings.json`（用户级）**高于** CMD 环境变量和项目级 `.claude/settings.json`。如果用户级配置中设置了 `ANTHROPIC_BASE_URL` 指向其他 API，代理注入的环境变量会被覆盖。

**解决**：确保 `%USERPROFILE%\.claude\settings.json` 中没有与代理冲突的 `env` 字段，或将其清空为 `{}`。代理启动 CC 时会自动注入正确的环境变量。

```powershell
# 查看当前用户级 CC 配置
type %USERPROFILE%\.claude\settings.json

# 如果 env 中有 ANTHROPIC_BASE_URL 指向非本地地址，备份后清空
copy %USERPROFILE%\.claude\settings.json %USERPROFILE%\.claude\settings.json.bak
echo {} > %USERPROFILE%\.claude\settings.json
```

> 💡 恢复直连时，把备份文件还原即可。

### Auth conflict 警告

CC 启动时出现 `Both a token (ANTHROPIC_AUTH_TOKEN) and an API key (ANTHROPIC_API_KEY) are set` 警告。代理服务启动时会**自动清除**进程中的 `ANTHROPIC_AUTH_TOKEN`，拉起 CC 时也会在子进程环境中物理删除该变量。如果仍有问题，请清除终端会话中的残留环境变量：

```cmd
set ANTHROPIC_AUTH_TOKEN=
set ANTHROPIC_BASE_URL=
```

### 工具调用不生效 / 乱调工具

**模型乱调工具**（如"你好"触发 save-memory）：使用推荐模型 `nvidia/llama-3.3-nemotron-super-49b-v1.5`，代理内置的工具调用防护会在系统提示中注入使用规范，并自动过滤 input 为空的多余 tool_use。

**工具调用参数不对**（如 AskUserQuestion 输出空选项）：代理内置 **Tool Schema 通用拍平**，将复杂嵌套 schema 自动简化为模型能处理的格式，响应阶段按原始 schema 重建。所有工具自动适配，无需单独配置。

**不支持 function calling 的模型**：如果目标模型完全不支持原生 function calling，代理会从文本中提取 JSON 格式的 tool call 兜底。前端 API 配置中提供"启用工具调用"开关，可按配置独立控制。

---

## 🔒 安全说明

- 所有 API 密钥和配置数据 **仅存储在本地浏览器**（localStorage），不会上传到任何服务器
- 代理服务仅监听 `localhost` / `127.0.0.1`，不暴露到公网
- 所有请求通过本地直转，**不经过任何第三方中转**

---

## 🛠️ 技术栈

- **前端**：React 18 + React Router 6 + Tailwind CSS + Lucide Icons
- **构建**：Vite 5
- **后端**：Node.js + Express 5
- **协议转换**：自研 Claude ↔ OpenAI 双向转换引擎

---

## 📄 License

MIT
