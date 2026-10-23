[Setup]
AppId=DeutschAssistant.Desktop
AppName=德语学习助手
AppVersion=1.0.4
AppPublisher=Deutsch Learning Assistant
DefaultDirName={localappdata}\Programs\DeutschAssistant
DefaultGroupName=德语学习助手
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64os
ArchitecturesInstallIn64BitMode=x64os
MinVersion=10.0
OutputDir=..\..\dist
OutputBaseFilename=Deutsch-Assistant-Windows-Setup
SetupIconFile=app.ico
UninstallDisplayIcon={app}\DeutschAssistant.exe
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
CloseApplications=yes

[Tasks]
Name: desktopicon; Description: 创建桌面快捷方式; Flags: unchecked

[Files]
Source: bin\Release\net48\*; DestDir: {app}; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: *.pdb

[Icons]
Name: {group}\德语学习助手; Filename: {app}\DeutschAssistant.exe
Name: {autodesktop}\德语学习助手; Filename: {app}\DeutschAssistant.exe; Tasks: desktopicon

[Run]
Filename: {app}\DeutschAssistant.exe; Description: 打开德语学习助手; Flags: nowait postinstall skipifsilent

[Code]
function RuntimeInRegistry(Root: Integer): Boolean;
var
  Value: String;
  Version: Int64;
begin
  Result := False;
  if RegQueryStringValue(Root,
    'Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}', 'pv', Value) then
    if StrToVersion(Value, Version) then Result := Version > 0;
end;

function InitializeSetup: Boolean;
var
  Missing: String;
begin
  Missing := '';
  if not IsDotNetInstalled(net48, 0) then
    Missing := Missing + '.NET Framework 4.8（或 4.8.1）：' + #13#10 +
      'https://dotnet.microsoft.com/download/dotnet-framework/net48' + #13#10#13#10;
  if not (RuntimeInRegistry(HKLM32) or RuntimeInRegistry(HKLM64) or
    RuntimeInRegistry(HKCU32) or RuntimeInRegistry(HKCU64)) then
    Missing := Missing + 'Microsoft Edge WebView2 Evergreen Runtime：' + #13#10 +
      'https://developer.microsoft.com/microsoft-edge/webview2/' + #13#10#13#10;
  Result := Missing = '';
  if not Result then
  begin
    Log('Missing prerequisites: ' + Missing);
    SuppressibleMsgBox('安装已停止，此电脑缺少以下运行组件：' + #13#10#13#10 + Missing +
      '请从以上微软官方地址安装组件，再重新运行安装程序。离线电脑请提前准备离线安装包。',
      mbCriticalError, MB_OK, IDOK);
  end;
end;
