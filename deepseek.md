# 项目规则

## 技术栈

- **前端**：Kotlin + Jetpack Compose  
- **后端**：Express.js + CloudBase 云函数  
- **数据库**：CloudBase 云数据库（NoSQL）  
- **云服务**：CloudBase（云函数 + 云存储 + 云数据库）  
- **架构模式**：MVVM + Repository

## 目录结构

```
app/
└── src/main/java/com/example/musicgamevideotool/
    ├── ui/                     # UI层（Compose界面）
    │   ├── screen/             # 页面组件
    │   └── component/          # 可复用组件
    ├── viewmodel/              # ViewModel层
    ├── repository/             # Repository层
    ├── data/                   # 数据层
    │   ├── local/              # Room数据库
    │   │   ├── dao/            # 数据访问对象
    │   │   └── entity/         # 实体类
    │   ├── remote/             # API调用（Retrofit）
    │   │   └── model/          # 数据传输对象
    │   └── model/              # 数据模型
    ├── player/                 # 播放引擎（ExoPlayer）
    ├── di/                     # 依赖注入（Hilt）
    ├── utils/                  # 工具类
    └── MainActivity.kt
```

## 代码规范

- 使用 Kotlin 语言，遵循官方编码规范
- UI 使用 Jetpack Compose 声明式布局
- 遵循 MVVM 架构，ViewModel 管理状态
- Repository 作为单一数据源
- 使用 Coroutines 处理异步操作
- 数据类使用 `data class` 定义

## 禁止事项

- 不要在 Activity/Fragment 中直接操作数据库
- 不要跳过 Repository 直接调用 API
- 不要在 ViewModel 中持有 Context 引用
- 不要硬编码字符串，使用 strings.xml
- 不要在主线程执行耗时操作
- 不要修改配置文件（除非明确要求）
