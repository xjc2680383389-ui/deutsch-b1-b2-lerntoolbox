德语学习助手 · Windows 1.0.4 个人测试版

兼容目标与安装
- 面向 Intel/AMD x64 的 Windows 10 / 11；32 位 Windows 和 ARM64 暂不支持。
- 安装前需要 .NET Framework 4.8（或兼容的 4.8.1）及 Microsoft Edge WebView2 Evergreen Runtime。
- 安装器会检查两项依赖；缺失时停止并显示官方地址，不自动下载或安装运行组件。
- .NET Framework：https://dotnet.microsoft.com/download/dotnet-framework/net48
- WebView2：https://developer.microsoft.com/microsoft-edge/webview2/
- 离线电脑需先准备微软官方离线安装包。组件齐全后，学习内容随应用提供，无需连接网站。
- 以日常 Windows 用户安装，无需管理员权限。便携版请完整解压，保留 DLL、www 等文件。

使用与备份
- 顶部空白处可拖动，双击可最大化/还原；窗口四周和四角可调整大小。
- Ctrl+S 导出备份文件，Ctrl+O 导入；F11 全屏，Ctrl+加号/减号缩放，Ctrl+0 恢复。
- 手机与电脑分别保存进度，无云同步；使用数据管理页的完整 v1 备份文本或 JSON 文件转移。
- 导入替换全部本机记录，不合并进度；两个入口均校验完整 v1 结构，错误或未知版本不会覆盖原库。
- 导入前自动保留最近一份旧库。数据管理页点「导出导入前备份」，复制保存或确认后重新导入恢复。
- 若快照或主库保存失败，导入停止。快照也保存在本机，不是独立文件，请另行定期导出。
- UTF-8 备份导入和导出上限均为 10 MiB。学习事件保留最近 8000 条，不是无限历史归档。
- 德语朗读取决于电脑提供的语音能力；无可用语音时页面会提示。

数据与卸载
- 程序默认安装于 %LOCALAPPDATA%\Programs\DeutschAssistant。
- 进度、导入前快照及 WebView2 缓存位于 %LOCALAPPDATA%\DeutschAssistant\WebView2。
- 同一用户的安装版与便携版共享此目录；换解压目录不等于隔离试用，Windows 用户之间不共享。
- 更新、重装和卸载不主动删除数据目录，卸载后仍可能保留个人进度、快照与缓存。
- 数据管理页「清空当前记录」重置学习库，不会删除导入前快照或整个 WebView2 目录。
- 彻底清理时先确认备份，卸载并关闭应用后，仅删除上述数据目录；自行导出的文件需另行处理。

签名与验收边界
- 当前测试版安装器及主程序未作受信任代码签名，可能出现未知发布者提示或被设备策略阻止。
- 从对应 GitHub Actions 产物获取安装包，核对 SHA256SUMS.txt、版本与 provenance.json 的提交和签名状态。
- 未签名不等于已检出病毒，CI 通过也不等于杀毒扫描通过；不要为安装应用关闭防护。
- 自动验收在 Windows Server 2022 进行，使用实际安装 EXE 和隔离 profile，检查进程重开、同版本覆盖安装及卸载重装后的全字段数据。
- 这不代表 Windows 10/11 客户端、Windows 系统重启、真实默认 profile、1.0.3→1.0.4 升级或手机实机迁移已经验收。
- 每次构建的实际通过情况以对应 CI 和报告为准；客户端人工验收见仓库 desktop/windows/ACCEPTANCE.md。

第三方组件
Microsoft.Web.WebView2 SDK 1.0.4258.31（Microsoft）
https://www.nuget.org/packages/Microsoft.Web.WebView2/1.0.4258.31
许可文本随应用提供（WebView2-LICENSE.txt）。
