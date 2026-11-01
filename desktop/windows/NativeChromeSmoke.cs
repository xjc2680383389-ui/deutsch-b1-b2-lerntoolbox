using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace DeutschAssistant
{
    internal static class NativeChromeSmoke
    {
        [DllImport("user32.dll")] private static extern int GetWindowLong(IntPtr window,int index);
        [DllImport("user32.dll")] private static extern int SetWindowLong(IntPtr window,int index,int value);
        [DllImport("user32.dll")] private static extern IntPtr SendMessage(IntPtr window,int message,IntPtr wParam,IntPtr lParam);

        internal static void TryRestoreSystemCaption(MainWindow app)
        {
            // Reproduce framework/window-state style updates which used to restore a caption.
            int style=GetWindowLong(app.Handle,-16);
            SetWindowLong(app.Handle,-16,style|0x00C00000);
        }

        internal static async Task Check(MainWindow app,string directory,string name,Action<bool,string> check)
        {
            check((GetWindowLong(app.Handle,-16)&0x00C00000)==0,name+": native caption style stays absent");
            // Exercise the real Win32 repaint path, including inactive and active captions.
            foreach(int active in new[]{0,1})
            {
                SendMessage(app.Handle,0x86,(IntPtr)active,IntPtr.Zero);
                SendMessage(app.Handle,0x85,(IntPtr)1,IntPtr.Zero);
                await Task.Delay(150);
                var header=app.TitleBar.RectangleToScreen(app.TitleBar.ClientRectangle);
                using(var pixels=new Bitmap(header.Width,header.Height))
                using(var graphics=Graphics.FromImage(pixels))
                {
                    graphics.CopyFromScreen(header.Location,Point.Empty,header.Size);
                    bool clean=true;
                    foreach(double fraction in new[]{.3,.5,.7})
                    {
                        var color=pixels.GetPixel((int)(pixels.Width*fraction),pixels.Height/2);
                        var expected=app.BackColor;
                        clean &= Math.Abs(color.R-expected.R)<14 && Math.Abs(color.G-expected.G)<14 && Math.Abs(color.B-expected.B)<14;
                    }
                    check(clean,name+": "+(active==0?"inactive":"active")+" native repaint preserves the light header");
                }
            }
            // Capture visible screen pixels, including the actual window edge and title bar.
            // A composited WebView preview cannot detect native frame overpainting.
            var visible=Rectangle.Intersect(app.Bounds,Screen.FromControl(app).Bounds);
            using(var pixels=new Bitmap(visible.Width,visible.Height))
            using(var graphics=Graphics.FromImage(pixels))
            {
                graphics.CopyFromScreen(visible.Location,Point.Empty,visible.Size);
                pixels.Save(Path.Combine(directory,"qa-native-"+name+".png"),ImageFormat.Png);
            }
        }
    }
}
