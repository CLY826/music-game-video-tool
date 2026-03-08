# 音游练习助手 - 前端模块说明
## 一、模块功能
本模块为 Android 端音游视频练习辅助工具的前端核心，主要实现以下功能：
1. 视频管理：支持按音游名称对本地/云端视频进行分类、新增、删除、查询；
2. 播放控制：核心实现视频变速播放（0.5x-2.0x 可调）、片段标记/AB 循环播放（标记起始/结束时间，循环播放指定片段）；
3. 云同步：对接后端接口，实现视频文件的云端上传、下载，保证数据跨设备同步；
4. 基础交互：简洁的 UI 界面，支持视频列表展示、播放进度条拖拽、循环状态可视化。

## 二、技术选型

|          | 技术/工具                         |  选型说明                                     |
|-------------------|---------------------------------|-----------------------------------------|
| 开发工具          | Android Studio Hedgehog | 2023.1.1（稳定版）|
| 开发语言          | Kotlin（主）+ Java（辅）| Android 官方推荐，语法简洁且兼容现有 Java 生态 |
| 视频播放核心库    | ExoPlayer 2.19.1                                                         | Google 官方开源播放器，适配多格式视频，支持自定义播放控制 |
| 网络请求库        | Retrofit 2.9.0 + OkHttp 4.11.0                                           | 对接后端 RESTful API，实现视频上传/下载的网络请求 |
| 构建工具          | Gradle 8.2                                                               | Android Studio 标配构建工具，管理依赖和编译流程 |
| 最低兼容版本      | Android 8.0（API Level 26）| 覆盖 90% 以上安卓设备，兼顾兼容性和功能体验 |

## 三、目录结构（Android Studio 项目标准结构）
```
android/                          # 前端项目根目录（对应仓库 frontend 文件夹）
├── app/                          # 应用模块
│   ├── src/main/
│   │   ├── java/com/musicgame/videotool/
│   │   │   ├── MainActivity.kt           # 主界面（视频列表）
│   │   │   ├── VideoPlayerActivity.kt    # 视频播放页（核心功能）
│   │   │   ├── model/                    # 数据模型（Video、Game 等实体类）
│   │   │   ├── api/                      # 网络请求（对接后端接口）
│   │   │   ├── adapter/                  # 视频列表适配器
│   │   │   └── utils/                    # 工具类（时间转换、播放控制等）
│   │   ├── res/
│   │   │   ├── layout/                   # 布局文件（activity_main.xml、activity_player.xml）
│   │   │   ├── values/                   # 字符串、颜色、尺寸配置
│   │   │   └── drawable/                 # 图标、背景等资源
│   │   └── AndroidManifest.xml           # 应用清单（权限、Activity 注册）
│   ├── build.gradle                      # 模块级构建配置（依赖管理）
│   └── proguard-rules.pro                # 混淆规则
├── build.gradle                          # 项目级构建配置
├── gradle.properties                     # Gradle 全局配置
├── local.properties                      # 本地环境配置（SDK 路径，不上传仓库）
└── settings.gradle                       # 项目模块配置
```
## 四、运行方式
### 1. 环境准备
- 安装 Android Studio Hedgehog | 2023.1.1 及以上版本；
- 配置 Android SDK（API Level 26 及以上），确保 SDK Tools 中安装 Build-Tools、Platform-Tools；
- 连接安卓真机（开启开发者模式+USB 调试）或创建虚拟设备（推荐 Pixel 5，API 26）。

### 2. 编译运行步骤
1. 将仓库中 `frontend/` 目录下的代码导入 Android Studio（选择「Open an existing project」，选中 `android/` 根目录）；
2. 等待 Gradle 同步完成（首次同步需下载依赖，建议开启科学上网）；
3. 同步完成后，点击 Android Studio 顶部工具栏的「Run」按钮（绿色三角图标）；
4. 选择目标设备（真机/模拟器），点击「OK」，等待项目编译并安装到设备；
5. 安装完成后，自动启动应用，即可测试视频播放、标记循环等核心功能。

### 3. 常见问题解决
- Gradle 同步失败：检查 `local.properties` 中的 SDK 路径是否正确，或重启 Android Studio 并清除缓存（File → Invalidate Caches / Restart）；
- 应用安装失败：确保真机已开启 USB 调试，或模拟器已正常启动；
- 视频播放无响应：在 `AndroidManifest.xml` 中确认已添加存储/网络权限，真机需授予应用文件访问权限。
