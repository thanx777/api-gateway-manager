# Claude Code 记忆学习系统使用指南

## 概述

Claude Code 内置了一套**记忆系统**，可以在每次会话结束后自动或手动保存工作经验，并在未来的会话中自动加载这些经验，让 AI 越用越聪明。

这套系统由三部分组成：

| 组件 | 作用 | 触发方式 |
|------|------|----------|
| **Skill**（`/save`） | 扫描对话，提取经验，写入 memory 文件 | 手动输入 `/save` |
| **Stop Hook** | 每次退出 CC 时写时间戳，下次启动 AI 主动问是否保存 | 自动触发 |
| **Memory 文件** | 持久化存储的经验，下次会话自动加载 | CC 启动时自动读取 |

---

## 记忆层级

```
~/.claude/
├── memory/                      ← 用户级记忆（所有项目共享）
│   ├── MEMORY.md                ← 索引文件
│   └── cc-settings-priority.md  ← 通用规则示例
│
├── skills/
│   └── save-memory.md           ← 用户级 /save skill（所有项目可用）
│
├── settings.json                ← Stop hook 配置
│
└── projects/
    └── D--Vibecoding-TraeSolo-api-gateway-manager/
        └── memory/              ← 项目级记忆（仅本项目的学习经验）
            ├── MEMORY.md         ← 项目级索引
            ├── cc-settings-priority.md
            ├── proxy-troubleshooting.md
            ├── workdir-feature.md
            └── user-profile.md
```

### 用户级 vs 项目级

| 层级 | 路径 | 范围 | 存什么 |
|------|------|------|--------|
| **用户级** | `~/.claude/memory/` | 所有项目 | 通用规则、用户偏好、跨项目教训 |
| **项目级** | `~/.claude/projects/<slug>/memory/` | 当前项目 | Bug 根因、实现方案、项目特定流程 |

`/save` 命令**默认保存到项目级**，通用的跨项目经验会同时复制一份到用户级。

---

## 快速安装

### 1. 安装 Skill

在项目根目录创建 `.claude/skills/save-memory.md`：

```bash
mkdir -p .claude/skills
```

文件内容参见本项目 `.claude/skills/save-memory.md`，或直接复制：

```bash
cp .claude/skills/save-memory.md ~/.claude/skills/save-memory.md
```

### 2. 配置 Stop Hook

编辑 `~/.claude/settings.json`，添加：

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "command": "bash -c \"echo $(date '+%Y-%m-%dT%H:%M:%S') $(pwd) > $HOME/.claude/.last-session\""
      }
    ]
  }
}
```

### 3. 创建用户级记忆索引

```bash
mkdir -p ~/.claude/memory
```

创建 `~/.claude/memory/MEMORY.md`：

```markdown
- [session-log](.last-session) — 检查上次会话时间，主动问是否 /save
```

### 4. 重启 Claude Code

Skill 在 CC 启动时加载，**重启后 `/save` 才会出现在命令列表**。

---

## 日常使用

### 保存经验

```
/save
```

AI 会：
1. 扫描本次对话
2. 识别踩坑、新发现、用户偏好、实现方案
3. 写入独立的 `.md` 文件到项目记忆目录
4. 更新 `MEMORY.md` 索引
5. 通用经验同步到用户级
6. 汇报保存了哪些

### 自动提醒

每次启动 CC，AI 会检查 `~/.claude/.last-session`。如果距离上次会话超过 5 分钟，会主动问：

> "上次会话在 2026-05-17T18:00 结束，是否运行 /save 保存经验？"

### 什么时候该 save

- 花了半小时以上排查一个问题
- 发现了一个非显而易见的规则或限制
- 用户明确说了"记住这个"
- 实现了一个经过多次尝试才成功的功能
- 用户表达了一个强烈的偏好

### 什么时候不需要 save

- 单行 typo 修复
- 一眼就能看出的语法错误
- 随口问的简单问题
- 代码中已经很明显的逻辑

---

## Memory 文件格式

每个 memory 文件包含 YAML 前置元数据和正文：

```markdown
---
name: short-kebab-slug
description: 一行摘要，用于判断未来是否相关
metadata:
  type: user | feedback | project | reference
---

正文内容...

## Why:
根因或背景。

## How to apply:
什么场景下应该 recall 这个经验。
```

### 四种类型

| type | 用途 | 示例 |
|------|------|------|
| `user` | 用户角色、习惯、偏好 | "用户使用 Windows 11 + Git Bash" |
| `feedback` | 工作方式指导 | "排查问题先检查配置，不要先改代码" |
| `project` | Bug 根因、架构、方案 | "CC 配置优先级导致代理失效" |
| `reference` | 外部链接 | "Bug 追踪在 Linear 项目 INGEST" |

---

## 给新项目接入

在新项目根目录下只需要两步：

```bash
# 1. 安装 skill（软链或复制）
mkdir -p .claude/skills
cp ~/.claude/skills/save-memory.md .claude/skills/

# 2. 创建记忆目录
mkdir -p ~/.claude/projects/<new-project-slug>/memory
```

然后重启 CC，`/save` 即可用。用户级记忆（通用规则）会自动共享。

---

## 注意事项

- **记忆不是代码文档**：不要存能从代码推导出的信息（文件路径、函数名等）
- **MEMORY.md 有 200 行限制**：定期清理过时条目
- **跨项目经验谨慎复制**：确保是真正通用的教训，而非项目特定上下文
- **文件存在 `~/.claude/` 下**：不在 git 仓库内，不会被提交到 GitHub。如果需要团队共享，把值得分享的经验写成项目文档（如本文件）

---

## 相关文件

- `~/.claude/skills/save-memory.md` — Skill 定义
- `~/.claude/memory/` — 用户级记忆
- `~/.claude/projects/<slug>/memory/` — 项目级记忆
- `~/.claude/settings.json` — Hook 配置
- `.claude/skills/save-memory.md` — 项目内 Skill（可提交到 git）
