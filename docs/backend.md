# 音游练习助手 -后端模块说明

## 一、 模块功能

本模块为安卓前端提供后端接口支撑，核心功能：

1. 视频管理：提供视频上传、查询、下载接口，支持按游戏名称筛选视频；
2. 数据存储：基于MySQL存储视频元信息（名称、路径、所属游戏、上传时间等）；
3. 云存储对接：整合云存储服务（如阿里云OSS），管理视频文件的云端存储；
4. 基础校验：对前端请求参数进行校验，保证数据合法性与接口安全性。

## 二、 技术选型

|            | 技术/工具        | 选型说明                                        |
| ---------- | ---------------- | ----------------------------------------------- |
| 开发框架   | SpringBoot 2.7.x | 快速搭建后端服务，简化配置，适配RESTful API开发 |
| 开发语言   | Java 8           | 兼容SpringBoot生态，学习成本低，适配课程要求    |
| 数据库     | MySQL 8.0        | 关系型数据库，稳定易部署，存储视频元数据        |
| 持久层框架 | MyBatis-Plus     | 简化数据库CRUD操作，无需手动编写大量SQL         |
| 构建工具   | Maven            | 管理项目依赖，一键打包运行                      |
| 接口测试   | Postman/ApiFox   | 测试后端接口可用性                              |

## 三、 目录结构

```
backend/                      // 后端项目根目录
├── src/main/java/
│   ├── BackendApplication.java        // 项目启动类
│   ├── controller/                    // 接口层
│   │   └── VideoController.java       // 视频相关接口
│   ├── service/                       // 业务层
│   │   ├── VideoService.java         // 业务接口
│   │   └── impl/
│   │       └── VideoServiceImpl.java  // 业务实现类
│   ├── mapper/                        // 数据访问层
│   │   └── VideoMapper.java
│   ├── model/                         // 数据模型
│   │   ├── Video.java                 // 视频实体
│   │   └── Result.java                // 统一返回结果
│   ├── config/                        // 配置类
│   │   ├── DbConfig.java              // 数据库配置
│   │   ├── OssConfig.java             // 文件存储配置
│   │   └── CorsConfig.java            // 跨域配置
│   └── utils/                         // 工具类
│       ├── FileUtil.java              // 文件上传工具
│       └── ResultUtil.java            // 返回结果封装
├── src/main/resources
│   ├── application.yml                // 核心配置文件
│   └── mybatis/                       // MyBatis 映射文件
├── pom.xml                            // Maven 依赖配置
└── target/                            // 编译输出目录（不上传仓库）
```

## 四、运行方式

### 1. 环境准备

- 安装JDK 8及以上版本；
- 安装MySQL 8.0，创建数据库（如 `music_game_video`）；
- 配置 `application.yml` 中的MySQL账号、密码、数据库名，以及云存储密钥（可选）。

### 2. 编译运行步骤

1. 使用IDEA/Eclipse打开后端项目（或直接用命令行操作）；
2. 执行 `mvn clean install` 编译项目（首次运行下载依赖）；
3. 方式1（IDE运行）：直接运行 `BackendApplication.java` 启动类；
4. 方式2（命令行）：进入项目根目录，执行 `java -jar target/后端项目包名.jar`；
5. 启动成功后，可通过 `http://localhost:8080` 访问接口（默认端口8080）；
6. 用Postman测试接口（如 `POST /video/upload` 上传视频、`GET /video/list?gameName=xxx` 查询视频）。

### 3. 常见问题解决

- 启动失败：检查MySQL是否启动、`application.yml` 数据库配置是否正确；
- 接口访问失败：确认后端端口未被占用，且已配置跨域允许前端访问；
- 视频上传失败：检查云存储密钥配置、服务器文件上传路径权限。
