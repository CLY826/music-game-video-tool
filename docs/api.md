# 音游练习助手-API 接口设计

## 一、模块功能

1. 游戏接口：提供游戏列表查询、新增接口。
2. 视频接口：提供视频列表、上传、删除接口。
3. 练习参数接口：保存和获取倍速、标记点、循环范围。
4. 基础接口：提供文件路径、配置读取等通用接口。

## 二、 技术选型

- 接口风格：RESTful
- 数据格式：JSON
- 请求方式：GET、POST
- 跨域支持：CORS
- 返回格式：统一响应体

## 三、目录结构

```
controller/
├── GameController.java
├── VideoController.java
└── PracticeController.java
```

## 四、运行方式

1. 启动后端服务
2. 接口地址：http://localhost:8080/api/…
3. 前端通过 HTTP 请求调用接口
4. 接口返回 JSON 格式数据
