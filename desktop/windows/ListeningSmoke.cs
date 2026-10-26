using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Web.WebView2.Core;

namespace DeutschAssistant
{
    internal static class ListeningSmoke
    {
        internal static async Task Run(MainWindow app,string directory,Action<bool,string> check)
        {
            await app.Web.ExecuteScriptAsync("document.querySelector('.sentence-item[data-id=l19]').click()");
            await app.WaitFor("document.querySelector('#de-text').textContent.startsWith('Falls Sie Fragen')");
            foreach(int width in new[]{1920,1280,920})
            {
                await app.Web.CoreWebView2.CallDevToolsProtocolMethodAsync("Emulation.setDeviceMetricsOverride",app.Json.Serialize(new {width,height=1000,deviceScaleFactor=1,mobile=false}));
                await app.WaitFor("innerWidth==="+width);
                check((bool)await app.Value("(()=>{const panel=document.querySelector('.listen-right');return getComputedStyle(panel).writingMode==='horizontal-tb' && panel.scrollWidth<=panel.clientWidth+1 && [...panel.querySelectorAll('b')].every(el=>{const r=el.getBoundingClientRect();return r.width>r.height;});})()"),"Listening explanations and German phrases read horizontally at viewport width "+width);
                check((bool)await app.Value("(()=>{const left=document.querySelector('.listen-left').getBoundingClientRect(),right=document.querySelector('.listen-right').getBoundingClientRect();return innerWidth>1240?right.left>=left.right:right.top>=left.bottom;})()"),"Listening explanation layout fits available width "+width);
                await app.Web.ExecuteScriptAsync("document.querySelector('.listen-wrap').scrollIntoView({block:'start'})");
                await Task.Delay(150);
                string capture=await app.Web.CoreWebView2.CallDevToolsProtocolMethodAsync("Page.captureScreenshot","{\"format\":\"png\",\"captureBeyondViewport\":true}");
                var screenshot=(Dictionary<string,object>)app.Json.DeserializeObject(capture);
                File.WriteAllBytes(Path.Combine(directory,"qa-listening-horizontal-"+width+".png"),Convert.FromBase64String((string)screenshot["data"]));
            }
            await app.Web.ExecuteScriptAsync("document.querySelector('#toggle-hide').click()");
            check((bool)await app.Value("!document.querySelector('#de-text').textContent.includes('Falls') && document.querySelector('.listen-right').textContent.includes('sich wenden an')"),"Dictation mode hides the sentence and keeps horizontal explanations");
            await app.Web.ExecuteScriptAsync("(()=>{document.querySelector('#toggle-hide').click();const input=document.querySelector('#dictation');input.value='Test';input.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#check-btn').click();})()");
            await app.WaitFor("document.querySelector('#listening-feedback .feedback.no') && !document.querySelector('#check-btn').disabled");
            check(true,"Incorrect dictation shows feedback");
            await app.Web.ExecuteScriptAsync("document.querySelector('#clear-btn').click()");
            check((bool)await app.Value("document.querySelector('#dictation').value==='' && document.querySelector('#listening-feedback').textContent===''") ,"Clear resets dictation and feedback");
            await app.Web.ExecuteScriptAsync("(()=>{const input=document.querySelector('#dictation');input.value=document.querySelector('#de-text').textContent;input.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#check-btn').click();})()");
            await app.WaitFor("document.querySelector('#listening-feedback .feedback.ok') && !document.querySelector('#check-btn').disabled");
            check(true,"Correct dictation passes and is saved");
            await app.Web.ExecuteScriptAsync("document.querySelector('#level-filter').value='B1';document.querySelector('#level-filter').dispatchEvent(new Event('change',{bubbles:true}))");
            check((bool)await app.Value("[...document.querySelectorAll('.sentence-item .tag')].every(el=>el.textContent==='B1')"),"Listening level filter switches the sentence list");
            await app.Web.CoreWebView2.CallDevToolsProtocolMethodAsync("Emulation.clearDeviceMetricsOverride","{}");
        }
    }
}
