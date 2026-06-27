# 音游视频练习辅助小程序 — 架构设计文档

## 1. 系统总体架构

本项目基于 **微信小程序 + 微信云开发** 构建，采用前后端分离的 Serverless 架构，无需自建服务器。

### 架构总览图

```mermaid
graph TB
    subgraph 用户端["用户端 - 微信小程序"]
        UI[小程序界面 WXML/WXSS]
        Logic[页面逻辑 JS]
        CloudAPI[wx.cloud API]
    end

    subgraph 云端["微信云开发平台 - 腾讯云"]
        CF[云函数 login/getVideos/addComment/getComments/aiPolish/health/uploadVideo]
        DB[云数据库 user/video/comment/game/favorite]
        Storage[云存储 视频文件/图片]
        Env[环境变量 TOKENHUB_API_KEY]
    end

    subgraph 外部["外部服务"]
        AI[TokenHub AI API hy3-preview 模型]
    end

    UI --> Logic
    Logic --> CloudAPI
    CloudAPI --> CF
    CloudAPI --> DB
    CloudAPI --> Storage
    CF --> DB
    CF --> AI
    CF --> Env
    AI --> CF
```

### 架构分层图

```mermaid
graph LR
    subgraph 前端层["前端层"]
        P1[首页 index]
        P2[分类 category]
        P3[上传 upload]
        P4[播放 player]
        P5[搜索 search]
        P6[社区 community]
        P7[个人中心 profile]
    end

    subgraph 接口层["接口层 wx.cloud"]
        API1[callFunction 云函数调用]
        API2[database 数据库操作]
        API3[uploadFile 文件上传]
        API4[getTempFileURL 临时链接]
        API5[deleteFile 文件删除]
    end

    subgraph 后端层["后端层 - 云函数"]
        F1[login 用户认证]
        F2[getVideos 视频查询]
        F3[addComment 添加评论]
        F4[getComments 获取评论]
        F5[aiPolish AI 润色]
        F6[health 健康检查]
        F7[uploadVideo 视频上传处理]
    end

    subgraph 数据层["数据层"]
        D1[(user)]
        D2[(video)]
        D3[(comment)]
        D4[(game)]
        D5[(favorite)]
        S1[云存储 视频/图片]
    end

    P1 --> API2
    P2 --> API2
    P3 --> API1
    P3 --> API3
    P4 --> API2
    P5 --> API2
    P6 --> API2
    P7 --> API2
    P7 --> API5

    API1 --> F1 & F2 & F3 & F4 & F5 & F6 & F7
    API2 --> D1 & D2 & D3 & D4 & D5
    API3 --> S1
    API4 --> S1
    API5 --> S1

    F1 --> D1
    F2 --> D2 & D5
    F3 --> D3
    F4 --> D3
    F5 --> AI_EXTERNAL[TokenHub AI]
    F6 --> D1
```

---

## 2. 前端架构

### 页面结构

```mermaid
graph TD
    App[App 全局 - 云开发初始化+登录] --> Tab1[TabBar 首页]
    App --> Tab2[TabBar 社区]
    App --> Tab3[TabBar 我的]

    Tab1 --> Cat[分类页 - 按音游筛选视频]
    Cat --> Play[播放页 - 视频播放+评论]
    Play --> SearchPage[搜索页 - 关键词搜索]

    Tab2 --> Play2[播放页]

    Tab3 --> Upload[上传页 - 视频上传+AI润色]
    Tab3 --> ProfileDetail[个人信息管理]
    ProfileDetail --> Fav[收藏列表]
```

### TabBar 配置

| Tab | 页面路径 | 功能 |
|-----|---------|------|
| 首页 | `pages/index/index` | 视频列表 + 分类筛选 |
| 社区 | `pages/community/community` | 社区动态 + 评论 |
| 我的 | `pages/profile/profile` | 个人中心 + 收藏 + 上传 |

### 页面与数据交互方式

| 页面 | 数据交互方式 | 说明 |
|------|-------------|------|
| index | `wx.cloud.database()` | 直接读取 video/game 集合 |
| category | `wx.cloud.database()` | 直接读取 video 集合（按游戏筛选） |
| upload | `wx.cloud.callFunction('aiPolish')` + `wx.cloud.uploadFile()` | AI 润色用云函数，上传用云存储 |
| player | `wx.cloud.database()` + `wx.cloud.getTempFileURL()` | 读取视频 + 获取临时链接 |
| search | `wx.cloud.database()` | 正则搜索 video 集合 |
| community | `wx.cloud.database()` | 读取 video + comment 集合 |
| profile | `wx.cloud.database()` + `wx.cloud.deleteFile()` | 管理视频 + 删除云存储文件 |

---

## 3. 后端架构

### 云函数一览

| 云函数 | 入口参数 | 返回格式 | 功能 |
|--------|---------|---------|------|
| `login` | 无 | `{ openid, userInfo }` | 获取 openid，写入/查询 user 集合 |
| `getVideos` | `{ game, page, pageSize }` | `{ list, total }` | 查询视频列表（支持分页和筛选） |
| `addComment` | `{ videoId, content }` | `{ commentId }` | 添加评论到 comment 集合 |
| `getComments` | `{ videoId }` | `{ list }` | 获取某视频的所有评论 |
| `aiPolish` | `{ text }` | `{ polishedText }` | 调用 TokenHub AI API 润色描述 |
| `health` | 无 | `{ status, checks }` | 健康检查（数据库连通性 + 环境变量） |
| `uploadVideo` | `{ ... }` | `{ ... }` | 视频上传后续处理 |

### 云函数调用链

```mermaid
sequenceDiagram
    participant User as 小程序用户
    participant App as 小程序前端
    participant CF as 云函数
    participant DB as 云数据库
    participant AI as TokenHub AI

    Note over User,App: 1. 用户登录
    User->>App: 打开小程序
    App->>CF: callFunction login
    CF->>DB: 查询写入 user 集合
    DB-->>CF: 返回用户数据
    CF-->>App: openid userInfo

    Note over User,App: 2. 视频上传 + AI 润色
    User->>App: 输入描述文本
    App->>CF: callFunction aiPolish text
    CF->>AI: POST chat completions
    AI-->>CF: 润色结果
    CF-->>App: polishedText
    User->>App: 上传视频
    App->>App: wx.cloud.uploadFile

    Note over User,App: 3. 评论互动
    User->>App: 发表评论
    App->>CF: callFunction addComment videoId content
    CF->>DB: 写入 comment 集合
    CF-->>App: commentId
```

---

## 4. 数据流架构

```mermaid
flowchart LR
    subgraph 输入["数据输入"]
        V_UPLOAD[视频文件上传]
        V_DESC[视频描述输入]
        COMMENT[评论输入]
        LOGIN_IN[微信登录]
        SEARCH_IN[搜索关键词]
    end

    subgraph 处理["数据处理"]
        AI_PROC[AI 润色处理 aiPolish 云函数]
        DB_WRITE[数据库写入]
        DB_READ[数据库读取]
        FILE_PROC[云存储处理]
    end

    subgraph 输出["数据输出"]
        VIDEO_LIST[视频列表展示]
        VIDEO_PLAY[视频播放]
        COMMENT_LIST[评论列表]
        USER_INFO[用户信息]
    end

    V_UPLOAD --> FILE_PROC --> VIDEO_PLAY
    V_DESC --> AI_PROC --> DB_WRITE --> VIDEO_LIST
    COMMENT --> DB_WRITE --> COMMENT_LIST
    LOGIN_IN --> DB_WRITE --> USER_INFO
    SEARCH_IN --> DB_READ --> VIDEO_LIST
```

---

## 5. 运维架构

```mermaid
graph TB
    subgraph 开发环境["开发环境"]
        DEV_TOOL[微信开发者工具 本地调试+模拟器]
        LOCAL[本地代码编辑 VS Code/Cursor]
    end

    subgraph CI_CD["CI CD"]
        GH[GitHub Actions ESLint+Jest+Codecov]
        GITLEAKS[Gitleaks 密钥泄露扫描]
    end

    subgraph 部署["部署"]
        CF_DEPLOY[云函数部署 微信开发者工具]
        MINI_DEPLOY[小程序发布 微信平台审核]
    end

    subgraph 监控["监控"]
        HEALTH_CF[health 云函数 数据库连通性+环境变量检查]
        STRUCTURED_LOG[结构化日志 JSON格式统一输出]
        WX_MONITOR[微信云开发控制台 调用次数/错误率/响应时间]
    end

    LOCAL --> GH --> CF_DEPLOY
    CF_DEPLOY --> HEALTH_CF
    CF_DEPLOY --> STRUCTURED_LOG
    CF_DEPLOY --> WX_MONITOR
```

---

## 6. 技术选型说明

| 层级 | 技术 | 选择原因 |
|------|------|---------|
| 前端 | 微信小程序 WXML/WXSS/JS | 目标平台是微信，原生开发性能最优 |
| 后端 | 微信云开发（Serverless） | 无需自建服务器，自动扩缩容，开发成本低 |
| 数据库 | 云数据库（MongoDB 兼容） | 云开发内置，无需运维，文档型适合视频数据 |
| 存储 | 云存储 | 云开发内置，支持视频/图片上传和临时链接 |
| AI | TokenHub API (hy3-preview) | 轻量级文本润色，API Key 环境变量化 |
| 测试 | Jest + Mock | Node.js 生态成熟测试框架，覆盖率 96%+ |
| CI | GitHub Actions | 免费、配置简单、与 GitHub 深度集成 |
| 容器化 | Docker + Docker Compose | 统一开发环境，一键启动测试 |

---

## 7. 安全架构

```mermaid
graph TB
    subgraph 安全措施["安全措施"]
        AUTH[微信自动鉴权 openid 机制]
        ENV_VAR[环境变量 TOKENHUB_API_KEY]
        PARAM_LIMIT[参数限制 文本长度/分页大小]
        LOG_SEC[日志安全 不暴露内部细节]
        SCAN[Gitleaks 密钥泄露扫描]
    end

    AUTH --> CF[云函数]
    ENV_VAR --> CF
    PARAM_LIMIT --> CF
    LOG_SEC --> CF
    SCAN --> GH[GitHub Actions]
```

---

## 8. 架构特点总结

| 特点 | 说明 |
|------|------|
| **Serverless** | 无需自建服务器，云函数按调用计费 |
| **前后端分离** | 小程序前端 + 云函数后端，通过 wx.cloud API 交互 |
| **统一返回格式** | `{ code, data/message }` 便于前端统一处理 |
| **结构化日志** | JSON 格式日志，便于监控和分析 |
| **安全优先** | API Key 环境变量化 + 参数限制 + CI 密钥扫描 |
| **高测试覆盖** | 49 个测试，覆盖率 96%+ |
