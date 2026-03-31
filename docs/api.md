# 音游视频练习助手 - API 接口设计文档

## 一、模块功能

本模块为前后端交互的核心接口层，主要功能：

1. 提供视频上传、查询、删除、标记管理的 RESTful API；
2. 提供用户注册、登录、信息查询的认证接口；
3. 统一接口请求/响应格式，返回标准化数据；
4. 接口权限校验（JWT Token 验证），保护用户数据安全；
5. 对接后端云函数与前端，实现数据交互与逻辑中转。

---

## 二、技术选型

| 项目     | 选型                          | 说明                                   |
| -------- | ----------------------------- | -------------------------------------- |
| 接口风格 | RESTful API                   | HTTP 方法语义化（GET/POST/PUT/DELETE） |
| 数据格式 | JSON                          | 前后端统一数据交换格式                 |
| 测试工具 | Apifox / Postman              | 接口调试、参数验证、测试集合           |
| 文档规范 | OpenAPI 3.0 (Swagger)         | 标准化接口文档                         |
| 后端框架 | Express.js + CloudBase 云函数 | Node.js 运行时                         |
| 数据库   | CloudBase 云数据库 (NoSQL)    | 存储用户、视频、标记数据               |
| 身份认证 | JWT (JSON Web Token)          | 无状态认证                             |

---

## 三、目录结构

```


backend/cloudfunctions/music-api/
├── index.js # 云函数入口，API 路由实现
├── package.json # 依赖配置
└── node_modules/ # 依赖包

前端 API 访问层 (Android Kotlin)：
app/src/main/java/.../
├── api/
│ ├── ApiService.kt # Retrofit 接口定义
│ ├── ApiClient.kt # HTTP 客户端配置
│ └── AuthInterceptor.kt # Token 拦截器
├── repository/ # Repository 层（数据仓库）
│ ├── VideoRepository.kt
│ ├── AuthRepository.kt
│ └── MarkRepository.kt
├── model/ # 数据模型
│ ├── Video.kt
│ ├── User.kt
│ └── Mark.kt
└── utils/
└── Constants.kt # API 基础地址配置


```

---

## 四、接口列表

### 4.1 健康检查

| 项目     | 说明                                          |
| -------- | --------------------------------------------- |
| 接口路径 | `/health`                                     |
| 请求方法 | `GET`                                         |
| 请求参数 | 无                                            |
| 响应示例 | `{"status": "OK", "message": "服务运行正常"}` |

---

### 4.2 用户认证

#### 4.2.1 用户注册

| 项目     | 说明                                                         |
| -------- | ------------------------------------------------------------ |
| 接口路径 | `/api/auth/register`                                         |
| 请求方法 | `POST`                                                       |
| 请求参数 | `username`, `email`, `password`                              |
| 响应示例 | `{"success": true, "data": {"token": "...", "user": {...}}}` |

#### 4.2.2 用户登录

| 项目     | 说明                                                         |
| -------- | ------------------------------------------------------------ |
| 接口路径 | `/api/auth/login`                                            |
| 请求方法 | `POST`                                                       |
| 请求参数 | `email`, `password`                                          |
| 响应示例 | `{"success": true, "data": {"token": "...", "user": {...}}}` |

#### 4.2.3 获取当前用户信息

| 项目     | 说明                                                         |
| -------- | ------------------------------------------------------------ |
| 接口路径 | `/api/auth/me`                                               |
| 请求方法 | `GET`                                                        |
| 认证要求 | 需要 Token                                                   |
| 响应示例 | `{"success": true, "data": {"_id": "...", "username": "..."}}` |

---

### 4.3 视频管理

#### 4.3.1 获取视频列表

| 项目     | 说明                                                    |
| -------- | ------------------------------------------------------- |
| 接口路径 | `/api/videos`                                           |
| 请求方法 | `GET`                                                   |
| 请求参数 | `page`, `limit`, `gameName`（可选）                     |
| 响应示例 | `{"success": true, "data": [...], "pagination": {...}}` |

#### 4.3.2 获取单个视频详情

| 项目     | 说明                               |
| -------- | ---------------------------------- |
| 接口路径 | `/api/videos/{id}`                 |
| 请求方法 | `GET`                              |
| 响应示例 | `{"success": true, "data": {...}}` |

#### 4.3.3 创建视频记录

| 项目     | 说明                               |
| -------- | ---------------------------------- |
| 接口路径 | `/api/videos`                      |
| 请求方法 | `POST`                             |
| 认证要求 | 需要 Token                         |
| 请求参数 | `title`, `gameName`, `cloudUrl`    |
| 响应示例 | `{"success": true, "data": {...}}` |

#### 4.3.4 删除视频

| 项目     | 说明                                       |
| -------- | ------------------------------------------ |
| 接口路径 | `/api/videos/{id}`                         |
| 请求方法 | `DELETE`                                   |
| 认证要求 | 需要 Token（仅创建者可删除）               |
| 响应示例 | `{"success": true, "message": "删除成功"}` |

---

### 4.4 标记管理

#### 4.4.1 获取视频的所有标记

| 项目     | 说明                               |
| -------- | ---------------------------------- |
| 接口路径 | `/api/marks/{videoId}`             |
| 请求方法 | `GET`                              |
| 认证要求 | 需要 Token                         |
| 响应示例 | `{"success": true, "data": [...]}` |

#### 4.4.2 创建标记

| 项目     | 说明                                       |
| -------- | ------------------------------------------ |
| 接口路径 | `/api/marks`                               |
| 请求方法 | `POST`                                     |
| 认证要求 | 需要 Token                                 |
| 请求参数 | `videoId`, `startTime`, `endTime`, `label` |
| 响应示例 | `{"success": true, "data": {...}}`         |

#### 4.4.3 更新标记

| 项目     | 说明                               |
| -------- | ---------------------------------- |
| 接口路径 | `/api/marks/{id}`                  |
| 请求方法 | `PUT`                              |
| 认证要求 | 需要 Token（仅创建者可修改）       |
| 响应示例 | `{"success": true, "data": {...}}` |

#### 4.4.4 删除标记

| 项目     | 说明                                       |
| -------- | ------------------------------------------ |
| 接口路径 | `/api/marks/{id}`                          |
| 请求方法 | `DELETE`                                   |
| 认证要求 | 需要 Token（仅创建者可删除）               |
| 响应示例 | `{"success": true, "message": "删除成功"}` |

#### 4.4.5 批量同步标记

| 项目     | 说明                                                    |
| -------- | ------------------------------------------------------- |
| 接口路径 | `/api/marks/sync`                                       |
| 请求方法 | `POST`                                                  |
| 认证要求 | 需要 Token                                              |
| 请求参数 | `marks`（标记数组）                                     |
| 响应示例 | `{"success": true, "data": {"synced": 1, "failed": 0}}` |

---

## 五、通用响应格式

### 5.1 成功响应

```json
{
  "success": true,
  "data": { ... }
}
```



### 5.2 错误响应

json

```
{
  "success": false,
  "error": "错误信息"
}
```



------

## 六、状态码说明

| 状态码 | 说明                           |
| :----- | :----------------------------- |
| 200    | 请求成功                       |
| 400    | 请求参数错误                   |
| 401    | 未认证（Token 无效或过期）     |
| 403    | 无权限（非创建者操作他人资源） |
| 404    | 资源不存在                     |
| 500    | 服务器内部错误                 |

------

## 七、运行方式

### 7.1 后端运行

1. 部署云函数到 CloudBase：

   bash

   ```
   cd backend
   tcb fn deploy music-api
   ```

   

2. 获取访问地址：

   bash

   ```
   tcb fn get-url music-api
   ```

   

### 7.2 接口调用方式

**方式一：浏览器/HTTP 客户端（需开启 HTTP 服务）**

text

```
GET https://{环境ID}.service.tcloudbase.com/music-api/api/videos
```



**方式二：CloudBase 控制台测试**

- 进入云函数 → music-api → 函数代码 → 测试
- 输入测试参数：`{"path":"/api/videos","httpMethod":"GET"}`

**方式三：Android 端调用**

- 通过 Retrofit + ApiService 接口调用
- Repository 层封装数据获取逻辑

### 7.3 调用示例

bash

```
# 健康检查
curl https://你的环境ID.service.tcloudbase.com/music-api/health

# 获取视频列表
curl https://你的环境ID.service.tcloudbase.com/music-api/api/videos

# 创建视频（需要 Token）
curl -X POST https://你的环境ID.service.tcloudbase.com/music-api/api/videos \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"title":"测试视频","gameName":"Arcaea","cloudUrl":"https://..."}'
```



------

## 八、版本记录

| 版本 | 日期       | 修改内容                        |
| :--- | :--------- | :------------------------------ |
| v1.0 | 2026-03-31 | 初始版本，完成 API 接口设计文档 |

