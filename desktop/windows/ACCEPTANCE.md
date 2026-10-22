# Windows 客户端验收与发布要求

兼容目标为 Windows 10/11 Intel/AMD x64；ARM64 与 32 位系统被安装器拒绝。版本 1.0.4。AppId、虚拟来源和数据目录延续 1.0.3。

## 自动验收范围

Windows App 工作流使用 Windows Server 2022，启动实际安装 EXE，profile 位于隔离 QA 目录，验证：
- 原生文件备份往返；非法语法、空对象、非对象根、错误字段类型及未知版本拒绝，失败后主库不变。
- 数据页导出导入前快照、取消导入、无效文本不覆盖。
- 七页路由、原生窗口和听力页面交互。页面可见不等于全部功能或声音已人工验收。
- 进程退出重开、1.0.4 同版本覆盖安装和卸载重装后，全字段与退出前导出一致。
- 卸载后 EXE、开始菜单快捷方式和卸载项移除，隔离 profile 保留。
- 产物附 SHA256SUMS.txt 和 provenance.json，记录构建/源提交、版本、签名和未执行扫描状态。

报告中的 processRestartOnly=true 不代表 Windows 系统重启。通过状态、Runtime 和 OS 以对应 run 的报告为准。工作流未证明真实默认目录、跨版本升级或 Windows 10/11 客户端均成功。

## 发布前人工验收

以下项目均待验证，不能在发布说明中写成已通过。在可丢弃虚拟机或独立 Windows 用户中进行，勿用唯一的真实进度测试。

| 环境或项目 | 必须记录的结果 | 当前状态 |
| --- | --- | --- |
| Windows 10 22H2 x64、Windows 11 x64 标准用户 | OS 构建号、Runtime、安装器 SHA-256、安装与首次启动 | 待实测 |
| 缺 .NET 4.8 / 缺 WebView2 / 两者均缺 | 安装停止并指出依赖；补装后重试成功 | 待实测 |
| 用户名及安装路径含中文和空格 | 安装、启动、JSON 文件选择正常 | 待实测 |
| 125% / 150% DPI、多显示器 | 标题栏、缩放和页面无关键遮挡，真实德语声音可听见 | 待实测 |
| 手机→桌面→手机 | 卡组/词条、复习状态、错题、事件、语法/听力统计一致；替换不合并 | 待实测 |
| 1.0.3→1.0.4 升级 | 旧版写入已知数据，新版逐项比较 | 待实测 |
| 默认 profile、Windows 重启 | 进度及导入前快照可恢复 | 待实测 |
| 默认目录卸载重装 | 程序/快捷方式/卸载项移除，数据保留且重装后可读 | 待实测 |
| 保留下载来源标记的真实下载 | SmartScreen / Smart App Control 的具体结果 | 待实测 |
| 杀毒扫描 | 产品、定义版本、日期、SHA-256 和结果；报毒先复核，不关闭防护 | 待实测 |

## 签名与长期分发

当前没有可用受信任签名凭据，安装器与主程序保持未签名测试版。正式分发应为应用、安装器和卸载器签名并加时间戳，签后验证再生成哈希。不要在源码中提交私钥。自签证书不能替代受信任发布者身份，签名也不能保证新文件立即免除 SmartScreen 提示。

个人测试可使用明确标注未签名的 CI 产物。Actions 产物 14 天到期；长期分发需另行发布固定版本 Release，并附说明、提交与哈希。

官方参考：[WebView2 部署](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution)、[Inno Setup .NET 检测](https://jrsoftware.org/ishelp/topic_isxfunc_isdotnetinstalled.htm)、[SmartScreen 声誉](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation)。
