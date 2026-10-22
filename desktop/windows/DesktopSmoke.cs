using System;
using System.Collections.Generic;
using System.IO;
using System.Drawing;
using System.Windows.Forms;
using System.Threading.Tasks;
using Microsoft.Web.WebView2.Core;

namespace DeutschAssistant
{
    // CI uses an isolated profile and the installed EXE. No test data enters a user's profile.
    internal static class DesktopSmoke
    {
        internal static async Task Run(MainWindow app,string directory,bool reopen)
        {
            Directory.CreateDirectory(directory);
            var passed=new List<string>();
            Action<bool,string> check=(ok,name)=> { if(!ok) throw new Exception(name); passed.Add(name); };
            check(app.FormBorderStyle==FormBorderStyle.None,"System caption and blue frame are removed");
            check(app.MainMenuStrip==null,"File View Help menu bar is removed");
            check(app.TitleBar.Visible && app.MinimizeButton.Visible && app.MaximizeButton.Visible && app.CloseButton.Visible,"Custom window controls remain visible");
            check(app.ResizeHitTest(new Point(1,1))==13 && app.ResizeHitTest(new Point(app.ClientSize.Width-1,app.ClientSize.Height-1))==17,"Frameless resize corners remain available");
            check(MainWindow.IsDesktopShortcut(Keys.Control|Keys.S) && MainWindow.IsDesktopShortcut(Keys.Control|Keys.O),"File backup shortcuts remain available without a menu");
            check(MainWindow.IsLocal(MainWindow.Origin+"/index.html"),"Local HTTPS origin is accepted");
            check(!MainWindow.IsLocal("https://deutsch-assistant.example.evil/"),"Lookalike host is rejected");
            check(!MainWindow.IsLocal("http://deutsch-assistant.example/"),"HTTP is rejected");
            check(!MainWindow.IsLocal("file:///C:/Windows/win.ini"),"File navigation is rejected");
            NativeChromeSmoke.TryRestoreSystemCaption(app);
            await NativeChromeSmoke.Check(app,directory,reopen?"reopen":"normal",check);
            if(reopen)
            {
                check((bool)await app.Value("JSON.parse(localStorage.getItem('dwt.db.v1')).settings.dailyGoal===47"),"Learning settings survive process restart");
                check((bool)await app.Value("JSON.parse(localStorage.getItem('dwt.db.v1')).userDecks.some(d=>d.name==='Windows 验收卡组')"),"Custom decks survive process restart");
            }
            else
            {
                app.MaximizeButton.PerformClick();
                await Task.Delay(200);
                check(app.WindowState==FormWindowState.Maximized,"Custom maximize button works");
                var work=Screen.FromControl(app).WorkingArea;
                check(app.Bounds.Bottom<=work.Bottom+2 && app.Bounds.Top>=work.Top-2,"Maximized window respects taskbar working area");
                await NativeChromeSmoke.Check(app,directory,"maximized",check);
                app.MaximizeButton.PerformClick();
                check(app.WindowState==FormWindowState.Normal,"Custom restore button works");
                app.MinimizeButton.PerformClick();
                check(app.WindowState==FormWindowState.Minimized,"Custom minimize button works");
                app.WindowState=FormWindowState.Normal;
                app.ToggleFullscreen();
                check(!app.TitleBar.Visible,"Fullscreen hides the custom header");
                app.ToggleFullscreen();
                check(app.TitleBar.Visible && app.WindowState==FormWindowState.Normal,"Fullscreen restores the normal window");
                await NativeChromeSmoke.Check(app,directory,"restored",check);
                await app.AsyncValue("const {store}=await import('/js/ui/state.js');store.update(db=>{db.settings.dailyGoal=47;db.userDecks.push({id:'windows-qa',name:'Windows 验收卡组',level:'B1'});return db;});return store.lastSaveOk;");
                string backup=Path.Combine(directory,"learning-backup.json");
                await app.ExportBackup(backup);
                check(File.Exists(backup) && File.ReadAllText(backup).Contains("Windows 验收卡组"),"Native JSON export includes learning data");
                await app.AsyncValue("const {store}=await import('/js/ui/state.js');store.update(db=>{db.settings.dailyGoal=1;return db;});return true;");
                await app.ImportBackup(backup);
                await app.WaitFor("document.querySelector('#view-home.active h1') && JSON.parse(localStorage.getItem('dwt.db.v1')).settings.dailyGoal===47");
                check((bool)await app.Value("JSON.parse(localStorage.getItem('dwt.db.v1')).settings.dailyGoal===47"),"Native JSON import restores learning data");
                string original=(string)await app.Value("localStorage.getItem('dwt.db.v1')");
                string invalid=Path.Combine(directory,"invalid-backup.json");
                File.WriteAllText(invalid,"{invalid");
                bool rejected=false;
                try { await app.ImportBackup(invalid); } catch { rejected=true; }
                check(rejected,"Invalid backup is rejected");
                check(original==(string)await app.Value("localStorage.getItem('dwt.db.v1')"),"Rejected backup preserves existing data");
                foreach(string page in new[]{"home","cards","grammar","listening","mistakes","stats","data"})
                {
                    await app.Web.ExecuteScriptAsync("location.hash='#/"+page+"'");
                    await app.WaitFor("document.querySelector('#view-"+page+".active h1') && !document.querySelector('#view-"+page+"[aria-busy]')");
                    check((bool)await app.Value("document.querySelector('#view-"+page+" h1').getBoundingClientRect().height>0"),page+" route renders visibly");
                    await NativeChromeSmoke.Check(app,directory,page,check);
                    if(page=="listening") await ListeningSmoke.Run(app,directory,check);
                    if(page=="home" || page=="data")
                    {
                        await Task.Delay(500);
                        using(var image=File.Create(Path.Combine(directory,"qa-"+page+".png")))
                            await app.Web.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png,image);
                        if(page=="home")
                        {
                            using(var header=new Bitmap(app.TitleBar.Width,app.TitleBar.Height))
                            using(var frame=new Bitmap(app.ClientSize.Width,app.ClientSize.Height))
                            using(var content=Image.FromFile(Path.Combine(directory,"qa-home.png")))
                            using(var graphics=Graphics.FromImage(frame))
                            {
                                app.TitleBar.DrawToBitmap(header,new Rectangle(Point.Empty,header.Size));
                                graphics.Clear(app.BackColor);
                                graphics.DrawImage(header,app.PointToClient(app.TitleBar.PointToScreen(Point.Empty)));
                                graphics.DrawImage(content,new Rectangle(app.PointToClient(app.Web.PointToScreen(Point.Empty)),app.Web.Size));
                                frame.Save(Path.Combine(directory,"qa-window.png"),System.Drawing.Imaging.ImageFormat.Png);
                            }
                        }
                    }
                }
                await app.Web.ExecuteScriptAsync("location.hash='#/cards'");
                await app.WaitFor("document.querySelector('[data-select-for=deck-select]')");
                await app.Web.ExecuteScriptAsync("document.querySelector('[data-select-for=deck-select]').click()");
                await app.WaitFor("document.querySelector('dialog[open] .select-option')");
                check((bool)await app.Value("document.querySelector('dialog[open]').getBoundingClientRect().width>0"),"Themed deck picker opens");
                await app.Web.ExecuteScriptAsync("document.querySelector('dialog[open]').close()");
                string url=app.Web.Source.AbsoluteUri;
                bool blocked=false;
                EventHandler<CoreWebView2NavigationStartingEventArgs> denied=(s,e)=> { if(e.Uri=="https://example.com/") blocked=e.Cancel; };
                app.Web.CoreWebView2.NavigationStarting+=denied;
                app.Web.CoreWebView2.Navigate("https://example.com/");
                for(int i=0;i<30 && !blocked;i++) await Task.Delay(100);
                app.Web.CoreWebView2.NavigationStarting-=denied;
                check(blocked && app.Web.Source.AbsoluteUri==url,"External navigation is cancelled");
            }
            File.WriteAllText(Path.Combine(directory,reopen?"report-reopen.json":"report-first.json"),app.Json.Serialize(new { passed=true,checks=passed,runtime=app.Web.CoreWebView2.Environment.BrowserVersionString }));
        }
    }
}
