# 后端开发贡献说明

姓名：陈立垚
学号：2312190228
日期：2026-04-14

## 我完成的工作

### API 实现

- [x] 用户认证 API（注册 / 登录）— login 云函数实现微信登录与用户初始化
- [x] 业务资源 1 CRUD：视频管理 — getVideos 云函数实现视频分页查询、关键词搜索、分类筛选
- [x] 业务资源 2 CRUD：评论管理 — addComment + getComments 云函数实现评论发布与查询
- [x] 统一错误响应 — 所有云函数统一返回 { code, msg/data } 格式，错误信息不暴露内部细节

### 数据库

- [x] 数据模型定义（ER 图或模型文件）— 4 个集合：user、video、comment、favorite
- [x] ORM 配置 — 微信云开发自带 NoSQL 数据库（MongoDB），通过 wx-server-sdk 直接操作
- [ ] 数据库迁移脚本 — 不适用，云开发数据库为 NoSQL，无需迁移脚本

### 部署

- [x] Dockerfile 编写 — 基于 Node.js 22 LTS 的本地开发环境镜像
- [x] docker-compose.yml 配置 — 开发环境 + 测试环境 + 生产环境三套配置
- [x] 本地联调验证 — 通过 Docker 容器运行测试，49 个测试全部通过

## PR 链接

- PR #1: https://github.com/CLY826/music-game-video-tool/pull/1

## 遇到的问题和解决

1. 问题：分页查询参数 page 和 pageSize 无上限限制，恶意调用者可传入 pageSize=10000 拖垮数据库
   解决：添加参数校验，pageSize 上限设为 50，page 上限设为 100，sortBy 使用白名单校验只允许 createTime 和 songName

2. 问题：云函数默认允许匿名调用，addComment 可被未登录用户调用发布垃圾评论
   解决：在需要鉴权的云函数入口添加 OPENID 校验，通过 cloud.getWXContext() 获取调用者身份，若 OPENID 为空则返回未授权错误

3. 问题：getVideos 和 getComments 的 catch 块直接返回 e.message，可能暴露数据库连接字符串等内部信息
   解决：客户端只返回通用错误提示"服务暂时不可用"，详细错误信息只写入 console.error 供云开发日志查看

## 心得体会

后端开发让我深入理解了微信云开发的架构设计。5 个云函数分别承担认证、查询、写入和 AI 处理的职责，通过 wx-server-sdk 统一操作云数据库，省去了传统后端搭建服务器、配置 ORM、编写 SQL 的繁琐步骤。

在开发过程中，我特别注重安全性和健壮性：参数校验防止接口滥用，鉴权校验防止未授权访问，错误处理防止信息泄露。这些细节虽然增加了代码量，但保证了服务在真实环境下的稳定性。同时，结构化日志的引入让问题排查更加高效，通过 JSON 格式的日志可以快速定位错误原因和调用链路。
