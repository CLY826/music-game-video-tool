# Rhythm Practice - 音游视频练习辅助小程序

基于微信小程序 + 云开发搭建的音游视频练习辅助工具，支持 AB 循环播放、变速播放、AI 润色等功能。

## 状态徽章

[![CI](https://github.com/CLY826/music-game-video-tool/actions/workflows/ci.yml/badge.svg)](https://github.com/CLY826/music-game-video-tool/actions)
[![Backend Coverage](https://codecov.io/gh/CLY826/music-game-video-tool/branch/develop/graph/badge.svg?flag=backend)](https://codecov.io/gh/CLY826/music-game-video-tool)
[![Frontend Coverage](https://codecov.io/gh/CLY826/music-game-video-tool/branch/develop/graph/badge.svg?flag=frontend)](https://codecov.io/gh/CLY826/music-game-video-tool)

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
- **测试**：Jest + ESLint
- **CI/CD**：GitHub Actions + Codecov

## 项目结构

```
├── cloudfunctions/          # 云函数
│   ├── addComment/          # 添加评论
│   ├── aiPolish/            # AI 润色
│   ├── getComments/         # 获取评论
│   ├── getVideos/           # 获取视频列表
│   ├── login/               # 登录
│   └── uploadVideo/         # 上传视频
├── pages/                   # 小程序页面
│   ├── category/            # 分类页
│   ├── community/           # 社区页
│   ├── index/               # 首页
│   ├── player/              # 播放器页
│   ├── profile/             # 个人中心页
│   ├── search/              # 搜索页
│   └── upload/              # 上传页
├── tests/                   # 测试代码
│   ├── backend/             # 后端测试（单元测试 + 接口测试）
│   ├── frontend/            # 前端测试（组件测试 + 网络请求测试）
│   ├── jest.backend.config.js
│   ├── jest.frontend.config.js
│   └── package.json
├── .github/workflows/ci.yml # CI 工作流
├── .eslintrc.js             # ESLint 配置
├── app.js / app.json / app.wxss
└── project.config.json
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

## CI/CD

项目使用 GitHub Actions 实现持续集成：

- **触发条件**：push 到 `main`/`develop` 分支，或 PR 到 `main`
- **后端 Job**：ESLint 检查 + Jest 测试 + Codecov 覆盖率上传
- **前端 Job**：ESLint 检查 + Jest 测试 + Codecov 覆盖率上传

## 数据库集合

| 集合名 | 说明 |
|--------|------|
| game | 音游信息 |
| video | 视频记录 |
| comment | 评论数据 |
| favorite | 收藏记录 |
