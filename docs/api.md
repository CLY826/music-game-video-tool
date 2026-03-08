# 音游练习助手-API 接口设计

## 一、模块功能

本模块为前后端交互的核心接口层，主要功能：

1. 提供视频上传、查询、下载、删除的RESTful API；
2. 统一接口请求/响应格式，返回标准化数据（状态码、消息、数据体）；
3. 接口权限校验（基础token验证），防止非法请求；
4. 对接后端业务层与前端，实现数据交互与逻辑中转。

## 二、 技术选型

- 接口风格：RESTful API（HTTP请求方式语义化）
- 数据格式：JSON（前后端统一数据交换格式）
- 测试工具：Postman（接口调试、参数验证）
- 文档规范：Swagger（可选，自动生成接口文档）
- 核心依赖：SpringBoot Web（提供HTTP接口基础能力）

## 三、目录结构

```
backend/src/main/java/（包名）
├── controller/                // API 接口核心目录
│   ├── VideoController.java   // 视频相关接口（上传/查询/下载）
│   └── CommonController.java  // 通用接口（健康检查等）
├── model/
│   ├── request/               // 请求参数实体
│   │   └── VideoUploadReq.java
│   └── response/              // 响应结果实体
│       └── Result.java
└── config/
    └── WebConfig.java         // 跨域、接口配置
```

## 四、运行方式

1. 启动后端SpringBoot服务（参考backend.md运行步骤）；
2. 确认后端服务运行在 `http://localhost:8080`（默认端口）；
3. 接口调用方式：
   - 前端：通过Retrofit/OkHttp调用接口（如POST /api/video/upload）；
   - 测试：Postman输入接口地址，选择请求方式，传入参数调用；
4. 调用成功返回JSON格式结果（示例：`{"code":200,"msg":"成功","data":{}}`）；
5. 接口异常返回统一错误码（如`{"code":500,"msg":"服务器错误","data":null}`）。
