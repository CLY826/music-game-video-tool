# 安全审查贡献说明

姓名：陈立垚
学号：2312190228
日期：2026-05-12

## 我完成的工作

### AI 安全审查

- 审查了哪些文件/模块：5 个核心云函数（login、getVideos、addComment、getComments、aiPolish）
- AI 发现的主要问题：
  1. 硬编码 API Key（高危）— aiPolish 云函数中 TokenHub API Key 直接写在代码里
  2. 云函数缺少鉴权校验（中危）— 所有云函数未校验调用者身份
  3. 分页参数未限制（中危）— getVideos 和 getComments 的 page/pageSize 无上限
  4. 错误信息暴露内部细节（低危）— catch 块直接返回 e.message
  5. 关键词搜索未限制长度（低危）— keyword 参数无长度限制，存在 ReDoS 风险
  6. authorName 参数未限制长度（低危）— addComment 的作者名无长度限制
- 我修复了哪些问题：6 个问题全部修复

### 安全检查清单

- [x] 密码存储（bcrypt/argon2）— 不适用，项目使用微信登录，无密码体系
- [x] JWT/Session 过期机制 — 不适用，使用微信 openid 认证
- [x] 接口鉴权 — 已修复，aiPolish 和 addComment 添加 OPENID 校验
- [x] 越权访问 — 安全，数据库安全规则基于 auth.openid == doc.openid
- [x] SQL 注入 — 不适用，云数据库为 NoSQL（MongoDB）
- [x] XSS — 安全，小程序 WXML 不执行 HTML/JS
- [x] NoSQL 注入 — 已加固，参数类型校验 + 长度限制 + 白名单过滤
- [x] API Key 硬编码 — 已修复，改为环境变量读取
- [x] .gitignore 包含 .env — 已添加
- [x] .env.example 示例文件 — 已创建
- [x] npm audit — 已运行，无高危漏洞

### CI 安全扫描

- 配置了哪个选项：选项 A — Gitleaks 密钥泄露扫描
- 扫描结果：集成在 GitHub Actions 中，每次 push 和 pull_request 自动扫描硬编码的 API Key、密码、证书等敏感信息，防止未来开发中再次引入密钥泄露问题

### 选做完成情况

- 无

## PR 链接

- PR #1: https://github.com/CLY826/music-game-video-tool/pull/1

## 遇到的问题和解决

1. 问题：aiPolish 云函数的 API Key 原本硬编码在代码中，仓库为公开仓库，存在密钥泄露风险
   解决：将 API Key 改为通过 process.env.TOKENHUB_API_KEY 环境变量读取，创建 .env.example 示例文件，在微信云开发控制台中配置环境变量，并在 .gitignore 中添加 .env 防止意外提交

2. 问题：云函数默认允许匿名调用，addComment 可被未登录用户调用发布垃圾评论，aiPolish 可被未登录用户调用消耗 AI API 费用
   解决：在需要鉴权的云函数入口添加 OPENID 校验，通过 cloud.getWXContext() 获取调用者身份，若 OPENID 为空则返回未授权错误

## 心得体会

在 Vibe Coding 场景下，AI 大幅提升了开发效率，但也带来了安全隐患——AI 生成的代码可能包含硬编码密钥、缺少鉴权等问题。通过本次安全审查，我认识到开发效率和安全需要平衡：一方面利用 AI 快速实现功能，另一方面也要用 AI 进行安全审查，形成"AI 开发 + AI 审查"的双重保障。

具体来说，密钥管理是最基本的安全要求，API Key 必须通过环境变量注入，绝不能硬编码在代码中。输入校验和错误处理虽然看似细节，但能有效防止接口滥用和信息泄露。CI 中集成 Gitleaks 自动扫描则是最后一道防线，确保未来开发中不会再次引入密钥泄露问题。
