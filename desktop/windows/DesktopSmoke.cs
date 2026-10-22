using System;
using System.Collections.Generic;
using System.IO;
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
            check(MainWindow.IsLocal(MainWindow.Origin+"/index.html"),"Local HTTPS origin is accepted");
            check(!MainWindow.IsLocal("https://deutsch-assistant.example.evil/"),"Lookalike host is rejected");
            check(!MainWindow.IsLocal("http://deutsch-assistant.example/"),"HTTP is rejected");
            check(!MainWindow.IsLocal("file:///C:/Windows/win.ini"),"File navigation is rejected");
            if(reopen)
            {
                check((bool)await app.Value("JSON.parse(localStorage.getItem('dwt.db.v1')).settings.dailyGoal===47"),"Learning settings survive process restart");
                check((bool)await app.Value("JSON.parse(localStorage.getItem('dwt.db.v1')).userDecks.some(d=>d.name==='Windows 验收卡组')"),"Custom decks survive process restart");
            }
            else
            {
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
                    if(page=="home" || page=="data")
                    {
                        await Task.Delay(500);
                        using(var image=File.Create(Path.Combine(directory,"qa-"+page+".png")))
                            await app.Web.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png,image);
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
