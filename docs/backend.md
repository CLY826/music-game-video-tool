# 音游练习助手 -后端模块说明

## 一、 模块功能

1. 游戏管理：维护音游分类信息，支持新增、查询、删除。
2. 视频管理：管理本地视频文件，支持按游戏分类存储与查询。
3. 练习配置管理：保存视频倍速、片段标记、循环区间等练习数据。
4. 文件管理：统一管理视频存储路径、文件夹创建与文件读写。

## 二、 技术选型

- 开发语言：Java
- 开发框架：Spring Boot
- 数据库：SQLite
- 文件存储：本地文件系统
- 构建工具：Maven

## 三、 目录结构

```
backend/
├── src/main/java/com/backend
│   ├── controller
│   ├── service
│   ├── mapper
│   ├── model
│   └── utils
├── src/main/resources
├── video
└── pom.xml
```

## 四、运行方式

1. 导入项目到 IDEA
2. 加载 Maven 依赖
3. 启动主程序
4. 服务运行于 localhost:8080
