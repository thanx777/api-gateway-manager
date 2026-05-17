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
- 智能处理 SSE 流式响应合并为标准 JSON

### 🌐 本地代理引擎

- 本地常驻代理服务（Node.js Express），监听 `localhost:3001`
- 完整实现 Anthropic Messages API (`/v1/messages`)，让 Claude Code 透明对接任意模型
- 兼容 OpenAI Chat Completions API (`/v1/chat/completions`)，支持 Cursor / CodeX / Continue 等工具
- 自动 `max_tokens` 截断保护（默认 8192，防止第三方模型报错）
- 一键拉起 Claude Code，自动注入环境变量，支持指定工作目录

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
| `TOOLS_ENABLED` | 启用原生工具调用 | false |

> 💡 环境变量仅为初始默认值，所有配置均可通过前端 UI 动态修改，无需重启服务。

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
│  Cursor / CodeX │     │                            │     │  (OpenAI/DS/GLM) │
└─────────────────┘     │  ┌──────────────────────┐  │     └──────────────────┘
                        │  │ Claude → OpenAI 转换  │  │
                        │  │ max_tokens 截断       │  │
                        │  │ SSE 流合并            │  │
                        │  │ Tool Use 适配         │  │
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

CC 启动时出现 `Both a token (ANTHROPIC_AUTH_TOKEN) and an API key (ANTHROPIC_API_KEY) are set` 警告。这是因为用户级配置中留下了 `ANTHROPIC_AUTH_TOKEN`，与代理的 `ANTHROPIC_API_KEY` 冲突。清除用户级配置即可消除。

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
