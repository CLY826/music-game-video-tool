# API 设计与实现贡献说明

姓名：陈立垚
学号：2312190228
日期：2026-03-30

## 我完成的工作

### 1. API 设计

- [x] 用户认证 API 
- [x] 业务资源 API 
- [x] 查询接口设计

### 2. 文档编写

- [x] OpenAPI 文档 
- [x] API 使用说明

### 3. 前端实现

- [x] HTTP 客户端配置
- [x] API 调用函数封装 
- [x] Mock 数据配置

- [x] API 路由定义
- [x] 业务逻辑处理 
- [x] 错误处理 

### 5. 测试

- [x] Postman/Apifox 测试集合
- [x] 后端单元测试 — Jest 单元测试覆盖所有云函数
- [x] 测试用例数量：49 个（后端 34 个 + 前端 15 个）

## PR 链接

- PR #1: https://github.com/CLY826/music-game-video-tool/pull/1

## 遇到的问题和解决

1. 问题：getVideos 和 getComments 的查询参数无上限限制，恶意调用者可传入超大 pageSize 拖垮数据库
   解决：pageSize 上限设为 50，page 上限设为 100，sortBy 使用白名单校验只允许 createTime 和 songName，keyword 限制最大 50 字符

2. 问题：云函数返回的 e.message 可能包含数据库连接字符串等内部信息
   解决：catch 块中只返回通用错误提示"服务暂时不可用"，详细错误信息写入 console.error 供云开发日志查看

## 心得体会

微信云开发的 API 设计与传统 RESTful API 有很大不同。云函数通过 callFunction 调用而非 HTTP 请求，参数通过 event 对象传递，这意味着无法使用传统的 OpenAPI/Swagger 文档工具，但也简化了接口定义——每个云函数就是一个 API 端点。

在设计查询接口时，我特别注重参数校验和安全性：分页参数有上限、排序字段用白名单、搜索关键词限长度，这些措施有效防止了接口滥用。统一的 { code, msg } 响应格式让前端处理更加一致，错误信息不暴露内部细节则保障了系统安全。

测试方面，通过 Mock 微信 SDK 和全局 API，实现了在 Node.js 环境中测试云函数逻辑，49 个测试用例覆盖了正常流程、边界情况和异常处理，CI 覆盖率达到 96.07%。
