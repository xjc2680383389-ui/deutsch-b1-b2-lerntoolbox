德语学习助手 · Windows 1.0.3 个人测试版

支持 Windows 10 / 11 64 位，建议 Windows 11。
运行安装包，按提示完成安装后，从开始菜单打开「德语学习助手」。
便携版请完整解压后运行 DeutschAssistant.exe，保留旁边的 DLL、www 等文件。

使用
- 顶部使用与页面同色的无边框窗口，没有“文件 / 视图 / 帮助”菜单。
- 顶部空白处可拖动，双击可最大化/还原；窗口四周和四角可调整大小。
- 单词背卡、语法练习、听力精听、错题本和统计均复用手机版的学习功能。
- 内容随应用保存，日常学习无需连接网站。
- 导出备份 Ctrl+S，导入备份 Ctrl+O；也可在数据管理页面使用备份文本。
- F11 切换全屏；Ctrl+加号/减号调整大小，Ctrl+0 恢复。
- 手机与电脑分别保存进度，不会自动云同步。可将手机版导出的完整备份文本保存为 .json 或 .txt，再按 Ctrl+O 导入。
- 导入将替换此电脑的现有学习记录，请先导出备份。
- 更新、重新安装和卸载程序均不主动删除学习记录；重要进度仍请定期导出。

依赖与数据
- 使用 Windows 的 .NET Framework 4.8 和 Microsoft Edge WebView2 Runtime。
- Windows 11 通常已具备；若组件缺失，应用会提供微软官方下载入口：
  https://developer.microsoft.com/microsoft-edge/webview2/
- 学习数据位于当前 Windows 用户的 LocalAppData\DeutschAssistant\WebView2。
- 德语朗读取决于此电脑提供的语音能力；无可用语音时页面会提示。
- 安装包尚未购买商业代码签名证书。

第三方组件
Microsoft.Web.WebView2 SDK 1.0.4258.31（Microsoft）
https://www.nuget.org/packages/Microsoft.Web.WebView2/1.0.4258.31
许可文本随应用提供（WebView2-LICENSE.txt）。
