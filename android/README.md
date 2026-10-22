# 德语学习助手 · Android 测试安装版

将当前网页功能以本地资源形式打进 APK，Android 8.0 及以上可安装。使用 WebViewAssetLoader 从应用内 HTTPS 来源读取资源，开启 JavaScript 与本地 DOM 存储；不申请网络、相机、麦克风和文件系统权限，也不加载远程页面。

## 构建

需要 JDK 17、Gradle 8.10.2、Android SDK 35 与 Build Tools 35.0.0。

```sh
npm run selftest
node scripts/prepare-android.mjs
gradle -p android assembleDebug lintDebug --no-daemon
```

输出：`android/app/build/outputs/apk/debug/app-debug.apk`。GitHub 的 Android APK 工作流在 PR 更新时构建，并保存 `deutsch-assistant-android` 下载产物。

这是供个人测试的 Debug 签名版本；目前未完成手机实机验收。网页与安装版使用各自的存储空间，已有网页进度请先从数据管理导出，再在安装版中导入。卸载前也应导出备份。

本次沿用网页语音接口，Android WebView 是否支持德语朗读取决于系统；不支持时页面会提示对照原文练习。不能将已编译 APK 等同于手机上的听力与软键盘验收。

## 1.0.1 移动端修正

状态栏、刘海、底部导航栏和键盘的安全距离由 WebView 外层容器统一处理，避免直接给 WebView 留白导致滚动内容进入系统栏。选择菜单使用与网页一致的青绿面板，卡组创建与管理区域分隔。

页面和题库按需加载，离页释放隐藏 DOM；背卡翻面不再重算整组统计，评分的状态、事件和错题合为一次保存，失败整体回滚。首屏 JS 源码依赖从旧版 44 个文件、265372 字节降至 26 个文件、142613 字节；这不是手机实际内存、帧率或耗电的测量结果。

CI 在 Android 15 模拟器检查安全区域、创建/管理间距、自定义选择、快速切页，并上传截图与测试报告。测试签名现在缓存供后续本 PR 的构建复用；旧版临时签名不能据此保证相同。更新前应先导出学习进度，签名不同时不要在未备份的情况下卸载旧版。
