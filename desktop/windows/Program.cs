using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;

namespace DeutschAssistant
{
    internal static class Program
    {
        [STAThread]
        private static int Main(string[] args)
        {
            if (args.Contains("--check-runtime"))
            {
                try { return string.IsNullOrEmpty(CoreWebView2Environment.GetAvailableBrowserVersionString()) ? 2 : 0; }
                catch { return 2; }
            }
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            string qa = Option(args,"--self-test=");
            string profile = qa == null
                ? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"DeutschAssistant","WebView2")
                : Path.Combine(qa,"profile");
            bool created;
            using (var instance = new Mutex(true,"Local\\DeutschAssistant.Desktop",out created))
            {
                if (!created && qa == null)
                {
                    MessageBox.Show("德语学习助手已经打开，请在任务栏中切换到它。","德语学习助手");
                    return 0;
                }
                using (var window = new MainWindow(profile,qa,args.Contains("--verify-persistence")))
                {
                    Application.Run(window);
                    return window.ExitCode;
                }
            }
        }
        private static string Option(string[] args,string prefix) => args.FirstOrDefault(x=>x.StartsWith(prefix,StringComparison.Ordinal))?.Substring(prefix.Length);
    }
}
