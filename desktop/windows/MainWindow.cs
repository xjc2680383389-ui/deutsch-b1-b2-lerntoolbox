using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace DeutschAssistant
{
    internal sealed partial class MainWindow : Form
    {
        internal const string Origin = "https://deutsch-assistant.example";
        internal readonly DesktopWebView Web = new DesktopWebView();
        internal readonly JavaScriptSerializer Json = new JavaScriptSerializer { MaxJsonLength = 32*1024*1024 };
        private readonly string profile,qa;
        private readonly bool verify;
        private readonly Label loading;
        private FormWindowState savedState;
        private Rectangle savedBounds;
        private bool fullscreen;
        internal int ExitCode { get; private set; }

        internal MainWindow(string profile,string qa,bool verify)
        {
            this.profile=profile; this.qa=qa; this.verify=verify;
            Text="德语学习助手";
            StartPosition=FormStartPosition.CenterScreen;
            Size=new Size(1280,860); MinimumSize=new Size(760,600);
            AutoScaleDimensions=new SizeF(96F,96F); AutoScaleMode=AutoScaleMode.Dpi; BackColor=Color.FromArgb(247,248,245);
            string icon=Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"app.ico");
            if(File.Exists(icon)) Icon=new Icon(icon);
            InitializeChrome();
            Web.Shortcut=RunDesktopShortcut;
            loading=new Label { Text="正在准备你的学习空间…",Dock=DockStyle.Fill,TextAlign=ContentAlignment.MiddleCenter,Font=new Font("Microsoft YaHei UI",13F),ForeColor=Color.FromArgb(23,107,88) };
            Web.Dock=DockStyle.Fill; Web.Visible=false;
            var content=new Panel { Dock=DockStyle.Fill,Margin=Padding.Empty };
            content.Controls.Add(Web); content.Controls.Add(loading);
            var layout=new TableLayoutPanel { Dock=DockStyle.Fill,ColumnCount=1,RowCount=2,Margin=Padding.Empty,Padding=Padding.Empty };
            layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent,100));
            layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent,100));
            layout.Controls.Add(TitleBar,0,0); layout.Controls.Add(content,0,1); Controls.Add(layout);
            Shown+=async (s,e)=>await StartAsync();
            FormClosed+=(s,e)=>Web.Dispose();
        }
        private async Task StartAsync()
        {
            try
            {
                string assets=Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"www");
                if(!File.Exists(Path.Combine(assets,"index.html"))) throw new IOException("学习资源不完整，请重新安装应用。");
                Directory.CreateDirectory(profile);
                var environment=await CoreWebView2Environment.CreateAsync(null,profile);
                await Web.EnsureCoreWebView2Async(environment);
                var core=Web.CoreWebView2;
                core.SetVirtualHostNameToFolderMapping("deutsch-assistant.example",assets,CoreWebView2HostResourceAccessKind.Deny);
                core.Settings.AreDevToolsEnabled=false;
                core.Settings.IsStatusBarEnabled=false;
                core.Settings.IsWebMessageEnabled=false;
                core.Settings.AreHostObjectsAllowed=false;
                core.NavigationStarting+=(s,e)=> { if(!IsLocal(e.Uri)) e.Cancel=true; };
                core.NewWindowRequested+=(s,e)=>e.Handled=true;
                core.PermissionRequested+=(s,e)=>e.State=CoreWebView2PermissionState.Deny;
                core.DownloadStarting+=(s,e)=>e.Cancel=true;
                core.AddWebResourceRequestedFilter("*",CoreWebView2WebResourceContext.All);
                core.WebResourceRequested+=(s,e)=> {
                    if(!IsLocal(e.Request.Uri) && !e.Request.Uri.StartsWith("data:",StringComparison.OrdinalIgnoreCase)
                        && !e.Request.Uri.StartsWith("blob:"+Origin+"/",StringComparison.OrdinalIgnoreCase))
                        e.Response=environment.CreateWebResourceResponse(new MemoryStream(),403,"Forbidden","");
                };
                core.NavigationCompleted+=(s,e)=> {
                    if(e.IsSuccess) { loading.Visible=false; Web.Visible=true; Web.BringToFront(); }
                };
                core.Navigate(Origin+"/index.html");
                await WaitFor("document.querySelector('#view-home.active h1') && !document.querySelector('#launch-screen:not([hidden])')");
                if(qa!=null)
                {
                    await DesktopSmoke.Run(this,qa,verify);
                    CloseButton.PerformClick();
                }
            }
            catch(Exception error)
            {
                ExitCode=1;
                if(qa!=null)
                {
                    Directory.CreateDirectory(qa);
                    File.WriteAllText(Path.Combine(qa,"failure.txt"),error.ToString());
                    Close(); return;
                }
                loading.Text="暂时无法打开学习空间，请关闭后重试。";
                if(error is WebView2RuntimeNotFoundException)
                {
                    if(MessageBox.Show(this,"此电脑缺少 Microsoft Edge WebView2 运行组件。是否打开微软官方下载页面？",Text,MessageBoxButtons.YesNo,MessageBoxIcon.Information)==DialogResult.Yes)
                        Process.Start(new ProcessStartInfo("https://developer.microsoft.com/microsoft-edge/webview2/") { UseShellExecute=true });
                }
                else ShowError(error);
            }
        }
        internal static bool IsLocal(string url) => Uri.TryCreate(url,UriKind.Absolute,out Uri uri)
            && uri.Scheme=="https" && uri.Host=="deutsch-assistant.example" && uri.IsDefaultPort && uri.UserInfo.Length==0;
        internal async Task<object> Value(string script) => Json.DeserializeObject(await Web.ExecuteScriptAsync(script));
        internal async Task WaitFor(string expression)
        {
            var clock=Stopwatch.StartNew();
            while(clock.ElapsedMilliseconds<20000)
            {
                if((await Value("Boolean("+expression+")")) is bool value && value) return;
                await Task.Delay(100);
            }
            throw new TimeoutException("页面没有按时完成："+expression);
        }
        internal async Task<object> AsyncValue(string body)
        {
            string id=Guid.NewGuid().ToString("N"),key=Json.Serialize(id);
            await Web.ExecuteScriptAsync("window.__desktopResults=window.__desktopResults||{};(async()=>{try{const value=await(async()=>{"+body+"})();window.__desktopResults["+key+"]={ok:true,value};}catch(e){window.__desktopResults["+key+"]={ok:false,error:String(e.message||e)};}})();void 0;");
            await WaitFor("window.__desktopResults && window.__desktopResults["+key+"]");
            var result=(Dictionary<string,object>)await Value("window.__desktopResults["+key+"]");
            await Web.ExecuteScriptAsync("delete window.__desktopResults["+key+"]");
            if(!(bool)result["ok"]) throw new InvalidOperationException((string)result["error"]);
            return result.TryGetValue("value",out object value)?value:null;
        }
        internal async Task ExportBackup(string path)
        {
            string text=(string)await AsyncValue("const {store}=await import('/js/ui/state.js');return store.exportJson();");
            string temp=path+".tmp-"+Guid.NewGuid().ToString("N");
            try
            {
                File.WriteAllText(temp,text,new UTF8Encoding(false));
                if(File.Exists(path)) File.Replace(temp,path,null); else File.Move(temp,path);
            }
            finally { if(File.Exists(temp)) File.Delete(temp); }
        }
        internal async Task ImportBackup(string path)
        {
            if(new FileInfo(path).Length>10*1024*1024) throw new IOException("备份超过 10 MB，请确认选中了学习备份文件。");
            string text=File.ReadAllText(path,Encoding.UTF8);
            // 原生文件入口与页面文本入口共用版本、结构、类型和导入前快照保护。
            var result=(Dictionary<string,object>)await AsyncValue("const {store}=await import('/js/ui/state.js');return store.importJson("+Json.Serialize(text)+");");
            if(!(bool)result["ok"]) throw new InvalidDataException("导入失败："+result["error"]);
            var loaded=new TaskCompletionSource<bool>();
            EventHandler<CoreWebView2NavigationCompletedEventArgs> handler=(s,e)=>loaded.TrySetResult(e.IsSuccess);
            Web.CoreWebView2.NavigationCompleted+=handler;
            try
            {
                Web.CoreWebView2.Reload();
                if(await Task.WhenAny(loaded.Task,Task.Delay(20000))!=loaded.Task || !await loaded.Task)
                    throw new IOException("备份已保存，但页面刷新未完成，请重新打开应用。");
                await WaitFor("document.querySelector('.view.active h1') && !document.querySelector('.view.active[aria-busy]')");
            }
            finally { Web.CoreWebView2.NavigationCompleted-=handler; }
        }
        private async void ExportDialog()
        {
            try
            {
                if(Web.CoreWebView2==null) return;
                using(var dialog=new SaveFileDialog { Filter="学习备份 (*.json)|*.json",FileName="德语学习备份-"+DateTime.Now.ToString("yyyyMMdd-HHmm")+".json",DefaultExt="json",AddExtension=true,OverwritePrompt=true })
                    if(dialog.ShowDialog(this)==DialogResult.OK) { await ExportBackup(dialog.FileName); MessageBox.Show(this,"学习备份已保存。",Text); }
            }
            catch(Exception error) { ShowError(error); }
        }
        private async void ImportDialog()
        {
            try
            {
                if(Web.CoreWebView2==null) return;
                using(var dialog=new OpenFileDialog { Filter="学习备份 (*.json;*.txt)|*.json;*.txt|所有文件 (*.*)|*.*" })
                    if(dialog.ShowDialog(this)==DialogResult.OK && MessageBox.Show(this,"导入会替换此电脑的全部学习记录，不合并进度。将保留最近一次导入前备份，可在数据管理页面导出。继续导入吗？",Text,MessageBoxButtons.YesNo,MessageBoxIcon.Question)==DialogResult.Yes)
                    { await ImportBackup(dialog.FileName); MessageBox.Show(this,"学习备份已导入。",Text); }
            }
            catch(Exception error) { ShowError(error); }
        }
        private async void Navigate(string route)
        {
            try { if(Web.CoreWebView2!=null) await Web.ExecuteScriptAsync("location.hash="+Json.Serialize("#/"+route)); }
            catch(Exception error) { ShowError(error); }
        }
        private void Zoom(double amount) { if(Web.CoreWebView2!=null) Web.ZoomFactor=Math.Max(.7,Math.Min(1.8,Web.ZoomFactor+amount)); }
        internal void ToggleFullscreen()
        {
            if(!fullscreen)
            {
                savedBounds=Bounds; savedState=WindowState;
                fullscreen=true; TitleBar.Visible=false; Padding=Padding.Empty;
                WindowState=FormWindowState.Normal; WindowState=FormWindowState.Maximized;
            }
            else
            {
                fullscreen=false; WindowState=FormWindowState.Normal;
                TitleBar.Visible=true; Bounds=savedBounds; WindowState=savedState;
                UpdateChromeState();
            }
        }
        private void ShowError(Exception error) => MessageBox.Show(this,error.Message,Text,MessageBoxButtons.OK,MessageBoxIcon.Warning);
    }
}
