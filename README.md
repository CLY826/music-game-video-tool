# Rhythm Practice - 音游视频练习辅助小程序

基于微信小程序 + 云开发搭建的音游视频练习辅助工具，支持 AB 循环播放、变速播放、AI 润色等功能。

## 状态徽章

[![CI](https://github.com/CLY826/music-game-video-tool/actions/workflows/ci.yml/badge.svg)](https://github.com/CLY826/music-game-video-tool/actions)
[![Backend Coverage](https://codecov.io/gh/CLY826/music-game-video-tool/branch/main/graph/badge.svg?flag=backend)](https://codecov.io/gh/CLY826/music-game-video-tool)
[![Frontend Coverage](https://codecov.io/gh/CLY826/music-game-video-tool/branch/main/graph/badge.svg?flag=frontend)](https://codecov.io/gh/CLY826/music-game-video-tool)

## 功能列表

| 功能 | 说明 |
|------|------|
| 游戏分类 | 按音游分类浏览视频 |
| 视频上传 | 上传练习视频，支持填写备注说明 |
| AB 循环播放 | 设定片段循环播放，支持 0.5x - 1.5x 变速 |
| 搜索 | 按关键词搜索视频 |
| 社区 | 浏览社区公开视频 |
| 个人中心 | 管理收藏和个人信息 |
| AI 润色 | 对备注说明进行 AI 润色优化（基于 TokenHub + Hy3-preview） |

## 技术栈

- **前端**：微信小程序原生开发
- **后端**：微信云开发（云函数 + 云数据库 + 云存储）
- **AI 接口**：TokenHub API（Hy3-preview 模型）
- **测试**：Jest（后端 97%+ / 前端 92%+ 覆盖率）
- **CI/CD**：GitHub Actions + Codecov
- **安全**：Gitleaks 密钥泄露扫描 + 环境变量管理

## 项目结构

```
├── cloudfunctions/              # 云函数
│   ├── addComment/              # 添加评论
│   ├── aiPolish/                # AI 润色（TokenHub API）
│   ├── getComments/             # 获取评论列表
│   ├── getVideos/               # 获取视频列表
│   ├── health/                  # 健康检查（数据库连通性 + 环境变量校验）
│   ├── login/                   # 用户登录
│   └── uploadVideo/             # 上传视频
├── pages/                       # 小程序页面
│   ├── category/                # 分类页
│   ├── community/               # 社区页
│   ├── index/                   # 首页（游戏分类入口）
│   ├── player/                  # 播放器页（AB循环 + 变速）
│   ├── profile/                 # 个人中心页
│   ├── search/                  # 搜索页
│   └── upload/                  # 上传页
├── docs/                        # 项目文档
│   ├── architecture.md          # 架构设计
│   ├── database.md              # 数据库设计
│   ├── api.md                   # API 文档
│   ├── api.yaml                 # OpenAPI 规范
│   ├── frontend.md              # 前端开发文档
│   ├── backend.md               # 后端开发文档
│   ├── ai-feature.md            # AI 功能说明
│   ├── deployment.md            # 云服务部署说明
│   ├── monitoring.md            # 监控配置说明
│   ├── security-review.md       # 安全审查报告
│   ├── design-spec.md           # UI/UX 设计规格
│   ├── design/                  # 设计稿与截图
│   └── contributions/           # 成员贡献说明（按模块分册）
├── tests/                       # 测试代码
│   ├── backend/                 # 后端测试（单元测试 + 接口测试）
│   ├── frontend/                # 前端测试（组件测试 + 网络请求测试）
│   ├── jest.backend.config.js
│   ├── jest.frontend.config.js
│   └── package.json
├── .github/workflows/           # CI/CD 工作流
│   ├── ci.yml                   # 主 CI 流程
│   └── security.yml             # Gitleaks 安全扫描
├── .eslintrc.js                 # ESLint 配置
├── app.js / app.json / app.wxss # 小程序入口文件
├── project.config.json          # 微信开发者工具配置
└── CLAUDE.md                    # AI 辅助开发规则
```

## 运行项目

### 前置条件

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 微信公众平台账号（用于云开发环境）

### 步骤

1. 克隆项目：`git clone https://github.com/CLY826/music-game-video-tool.git`
2. 打开微信开发者工具，导入项目目录
3. 替换 `project.config.json` 中的 `appid` 为你自己的
4. 开通云开发环境，创建数据库集合（game、video、comment、favorite）
5. 右键每个云函数 → 上传并部署：云端安装依赖
6. 在云开发控制台配置环境变量 `TOKENHUB_API_KEY`（用于 AI 润色功能）

## 运行测试

```bash
cd tests

# 安装依赖
npm install

# 运行后端测试（含覆盖率）
npm run test:backend

# 运行前端测试（含覆盖率）
npm run test:frontend

# 运行全部测试
npm run test:all

# Lint 检查
npm run lint
```

### 测试覆盖情况

| 类别 | 测试数 | 覆盖率 |
|------|--------|--------|
| 后端单元测试 | 30 | 97.01% |
| 后端接口测试 | 13 | - |
| 前端组件测试 | 17 | 61.26% |
| 前端网络请求测试 | 6 | - |

## 数据库集合

| 集合名 | 说明 |
|--------|------|
| game | 音游信息（名称、封面、描述） |
| video | 视频记录（标题、分类、上传者、VID） |
| comment | 评论数据（视频 ID、用户、内容） |
| favorite | 收藏记录（用户 ID、视频 ID） |

## 云函数列表

| 云函数 | 触发方式 | 功能 |
|--------|----------|------|
| login | `wx.cloud.callFunction` | 用户登录，返回 openid |
| getVideos | `wx.cloud.callFunction` | 按分类获取视频列表 |
| addComment | `wx.cloud.callFunction` | 添加评论 |
| getComments | `wx.cloud.callFunction` | 获取视频评论列表 |
| aiPolish | `wx.cloud.callFunction` | AI 润色备注（调用 TokenHub API） |
| uploadVideo | `wx.cloud.callFunction` | 上传视频（直传云存储） |
| health | HTTP 触发 | 健康检查（数据库连通性 + 环境变量校验） |

## CI/CD

项目使用 GitHub Actions 实现持续集成：

- **触发条件**：push 到 `main`/`develop` 分支，或 PR 到 `main`
- **后端 Job**：ESLint 检查 + Jest 测试 + Codecov 覆盖率上传
- **前端 Job**：ESLint 检查 + Jest 测试 + Codecov 覆盖率上传
- **安全 Job**：Gitleaks 密钥泄露扫描

## 文档

| 文档 | 说明 |
|------|------|
| [architecture.md](docs/architecture.md) | 系统架构设计（含 Mermaid 图） |
| [database.md](docs/database.md) | 数据库设计（集合结构 + ER 图） |
| [api.md](docs/api.md) | API 接口文档 |
| [api.yaml](docs/api.yaml) | OpenAPI 3.0 规范 |
| [frontend.md](docs/frontend.md) | 前端开发文档 |
| [backend.md](docs/backend.md) | 后端开发文档 |
| [ai-feature.md](docs/ai-feature.md) | AI 功能集成说明 |
| [deployment.md](docs/deployment.md) | 云服务部署说明 |
| [monitoring.md](docs/monitoring.md) | 监控配置说明 |
| [security-review.md](docs/security-review.md) | 安全审查报告 |
| [design-spec.md](docs/design-spec.md) | UI/UX 设计规格 |

## 贡献

查看各模块贡献说明：[docs/contributions/](docs/contributions/)

| 模块 | 文档路径 |
|------|----------|
| UI 设计 | [02-ui/](docs/contributions/02-ui/) |
| 架构设计 | [03-architecture/](docs/contributions/03-architecture/) |
| API 设计 | [04-api/](docs/contributions/04-api/) |
| 前端开发 | [05-frontend/](docs/contributions/05-frontend/) |
| 后端开发 | [06-backend/](docs/contributions/06-backend/) |
| AI 集成 | [07-ai/](docs/contributions/07-ai/) |
| 软件测试 | [08-testing/](docs/contributions/08-testing/) |
| CI/CD | [09-cicd/](docs/contributions/09-cicd/) |
| 安全审查 | [10-security/](docs/contributions/10-security/) |
| Docker 部署 | [11-docker/](docs/contributions/11-docker/) |
| 云服务部署 | [12-cloud/](docs/contributions/12-cloud/) |
| 监控配置 | [13-monitoring/](docs/contributions/13-monitoring/) |

## 开源协议

MIT License
