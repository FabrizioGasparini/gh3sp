#define AppVersion "2.3.0"

[Setup]
AppName=Gh3sp
AppVersion={#AppVersion}
DefaultDirName={pf}\Gh3sp\{#AppVersion} 
DefaultGroupName=Gh3sp
OutputDir=.
OutputBaseFilename=gh3sp_installer
SetupIconFile=gh3sp.ico
UninstallDisplayIcon={app}\gh3sp.exe
ArchitecturesInstallIn64BitMode=x64

[Files]
Source: "gh3sp.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Gh3sp {#AppVersion}"; Filename: "{app}\gh3sp.exe"

[Registry]
Root: HKLM; Subkey: "SYSTEM\CurrentControlSet\Control\Session Manager\Environment"; ValueType: expandsz; ValueName: "Path"; ValueData: "{olddata};{pf}\Gh3sp\{#AppVersion}"; Flags: preservestringtype