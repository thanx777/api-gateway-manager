---
name: bat-file-encoding
description: Windows .bat 文件编码要求 — 中文必须 GBK 或全部用 ASCII
metadata:
  type: project
---

在 Windows 上通过非 Windows 工具（WSL、Claude Code bash、cross-platform editors）写入 .bat 文件时，如果包含中文字符，文件会以 UTF-8 编码保存，Windows CMD 无法正确解析，导致乱码和 "不是内部或外部命令" 错误。

**Why:** Windows CMD 默认使用 GBK/GB2312 编码。UTF-8 .bat 文件中的中文字符会被解析为乱码序列，其中可能包含被误认为命令的字符。

**How to apply:** 给 Windows 项目写 .bat 脚本时使用纯 ASCII 英文内容，避免出现中文。如果需要中文显示，用英文描述然后用注释标注中文含义，或者用 `chcp 65001` 并在文件头部加 UTF-8 BOM（但这不可靠）。
