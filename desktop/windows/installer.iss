[Setup]
AppId=DeutschAssistant.Desktop
AppName=德语学习助手
AppVersion=1.0.3
AppPublisher=Deutsch Learning Assistant
DefaultDirName={localappdata}\Programs\DeutschAssistant
DefaultGroupName=德语学习助手
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
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
