using System;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace DeutschAssistant
{
    internal sealed partial class MainWindow
    {
        internal TableLayoutPanel TitleBar { get; private set; }
        internal Button MinimizeButton { get; private set; }
        internal Button MaximizeButton { get; private set; }
        internal Button CloseButton { get; private set; }
        private const int WM_NCHITTEST=0x84,WM_NCCALCSIZE=0x83,WM_GETMINMAXINFO=0x24;
        [DllImport("user32.dll")] private static extern bool ReleaseCapture();
        [DllImport("user32.dll")] private static extern IntPtr SendMessage(IntPtr window,int message,IntPtr wParam,IntPtr lParam);
        [DllImport("dwmapi.dll")] private static extern int DwmSetWindowAttribute(IntPtr window,int attribute,ref int value,int size);
        [StructLayout(LayoutKind.Sequential)] private struct NativePoint { public int X,Y; }
        [StructLayout(LayoutKind.Sequential)] private struct MinMaxInfo
        {
            public NativePoint Reserved,MaxSize,MaxPosition,MinTrackSize,MaxTrackSize;
        }

        private void InitializeChrome()
        {
            FormBorderStyle=FormBorderStyle.None;
            Padding=new Padding(4);
            TitleBar=new TableLayoutPanel { Name="desktop-chrome",Dock=DockStyle.Fill,Height=36,
                ColumnCount=4,RowCount=1,Margin=Padding.Empty,Padding=Padding.Empty,BackColor=BackColor };
            TitleBar.ColumnStyles.Add(new ColumnStyle(SizeType.Percent,100));
            for(int i=0;i<3;i++) TitleBar.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute,46));
            TitleBar.RowStyles.Add(new RowStyle(SizeType.Absolute,36));
            var title=new Label { Text=Text,Dock=DockStyle.Fill,TextAlign=ContentAlignment.MiddleLeft,
                ForeColor=Color.FromArgb(92,111,101),Font=new Font("Microsoft YaHei UI",9F),
                Padding=new Padding(12,0,0,0),Margin=Padding.Empty,AutoEllipsis=true };
            title.MouseDown+=DragWindow; TitleBar.MouseDown+=DragWindow;
            MinimizeButton=new CaptionButton("minimize",()=>WindowState=FormWindowState.Minimized,()=>false);
            MaximizeButton=new CaptionButton("maximize",ToggleMaximize,()=>WindowState==FormWindowState.Maximized);
            CloseButton=new CaptionButton("close",()=>Close(),()=>false);
            TitleBar.Controls.Add(title,0,0); TitleBar.Controls.Add(MinimizeButton,1,0);
            TitleBar.Controls.Add(MaximizeButton,2,0); TitleBar.Controls.Add(CloseButton,3,0);
            Resize+=(s,e)=>UpdateChromeState();
        }
        protected override CreateParams CreateParams
        {
            get
            {
                var parameters=base.CreateParams;
                // Retain native resizing, taskbar and system keyboard window actions.
                parameters.Style|=0x00040000|0x00080000|0x00010000|0x00020000;
                return parameters;
            }
        }
        protected override void OnHandleCreated(EventArgs e)
        {
            base.OnHandleCreated(e);
            // Windows 11: do not draw the system accent border around the custom frame.
            // Unsupported attributes on Windows 10 return an HRESULT and are harmless.
            int noBorder=unchecked((int)0xFFFFFFFE),rounded=2;
            DwmSetWindowAttribute(Handle,34,ref noBorder,sizeof(int));
            DwmSetWindowAttribute(Handle,33,ref rounded,sizeof(int));
        }
        private void DragWindow(object sender,MouseEventArgs e)
        {
            if(e.Button!=MouseButtons.Left || fullscreen) return;
            if(e.Clicks==2) { ToggleMaximize(); return; }
            ReleaseCapture();
            SendMessage(Handle,0xA1,(IntPtr)2,IntPtr.Zero);
        }
        internal void ToggleMaximize()
        {
            if(fullscreen) { ToggleFullscreen(); return; }
            WindowState=WindowState==FormWindowState.Maximized?FormWindowState.Normal:FormWindowState.Maximized;
        }
        private void UpdateChromeState()
        {
            Padding=fullscreen || WindowState==FormWindowState.Maximized?Padding.Empty:new Padding(Math.Max(4,DeviceDpi/24));
            if(MaximizeButton!=null)
            {
                MaximizeButton.AccessibleName=WindowState==FormWindowState.Maximized?"还原窗口":"最大化窗口";
                MaximizeButton.Invalidate();
            }
        }
        internal int ResizeHitTest(Point point)
        {
            if(fullscreen || WindowState!=FormWindowState.Normal) return 1;
            int edge=Math.Max(6,DeviceDpi/16);
            bool left=point.X<edge,right=point.X>=ClientSize.Width-edge;
            bool top=point.Y<edge,bottom=point.Y>=ClientSize.Height-edge;
            if(top && left) return 13; if(top && right) return 14;
            if(bottom && left) return 16; if(bottom && right) return 17;
            if(left) return 10; if(right) return 11; if(top) return 12; if(bottom) return 15;
            return 1;
        }
        protected override void WndProc(ref Message message)
        {
            if(message.Msg==WM_NCCALCSIZE && message.WParam!=IntPtr.Zero)
            {
                message.Result=IntPtr.Zero; return;
            }
            base.WndProc(ref message);
            if(message.Msg==WM_NCHITTEST && message.Result==(IntPtr)1)
            {
                long packed=message.LParam.ToInt64();
                var point=PointToClient(new Point((short)(packed&0xffff),(short)((packed>>16)&0xffff)));
                message.Result=(IntPtr)ResizeHitTest(point);
            }
            if(message.Msg==WM_GETMINMAXINFO)
            {
                var screen=Screen.FromHandle(Handle);
                var target=fullscreen?screen.Bounds:screen.WorkingArea;
                var info=(MinMaxInfo)Marshal.PtrToStructure(message.LParam,typeof(MinMaxInfo));
                info.MaxPosition.X=target.Left-screen.Bounds.Left; info.MaxPosition.Y=target.Top-screen.Bounds.Top;
                info.MaxSize.X=target.Width; info.MaxSize.Y=target.Height;
                Marshal.StructureToPtr(info,message.LParam,false);
            }
        }
        internal static bool IsDesktopShortcut(Keys keys)
        {
            return keys==(Keys.Control|Keys.S) || keys==(Keys.Control|Keys.O) || keys==Keys.F11
                || keys==(Keys.Control|Keys.Home) || keys==(Keys.Alt|Keys.Left)
                || keys==(Keys.Control|Keys.Oemplus) || keys==(Keys.Control|Keys.Add)
                || keys==(Keys.Control|Keys.OemMinus) || keys==(Keys.Control|Keys.Subtract)
                || keys==(Keys.Control|Keys.D0) || keys==(Keys.Control|Keys.NumPad0);
        }
        private void RunDesktopShortcut(Keys keys)
        {
            try
            {
                if(keys==(Keys.Control|Keys.S)) ExportDialog();
                else if(keys==(Keys.Control|Keys.O)) ImportDialog();
                else if(keys==Keys.F11) ToggleFullscreen();
                else if(keys==(Keys.Control|Keys.Home)) Navigate("home");
                else if(keys==(Keys.Alt|Keys.Left)) { if(Web.CoreWebView2?.CanGoBack==true) Web.CoreWebView2.GoBack(); }
                else if(keys==(Keys.Control|Keys.Oemplus) || keys==(Keys.Control|Keys.Add)) Zoom(.1);
                else if(keys==(Keys.Control|Keys.OemMinus) || keys==(Keys.Control|Keys.Subtract)) Zoom(-.1);
                else Web.ZoomFactor=1;
            }
            catch(Exception error) { ShowError(error); }
        }
        protected override bool ProcessCmdKey(ref Message message,Keys keys)
        {
            if(IsDesktopShortcut(keys)) { RunDesktopShortcut(keys); return true; }
            return base.ProcessCmdKey(ref message,keys);
        }
    }

    internal sealed class DesktopWebView : Microsoft.Web.WebView2.WinForms.WebView2
    {
        internal Action<Keys> Shortcut;
        protected override bool ProcessCmdKey(ref Message message,Keys keys)
        {
            if(MainWindow.IsDesktopShortcut(keys))
            {
                BeginInvoke(new Action(()=>Shortcut?.Invoke(keys)));
                return true;
            }
            return base.ProcessCmdKey(ref message,keys);
        }
    }

    internal sealed class CaptionButton : Button
    {
        private readonly string action;
        private readonly Func<bool> maximized;
        private bool hovered;
        internal CaptionButton(string action,Action clicked,Func<bool> maximized)
        {
            this.action=action; this.maximized=maximized;
            Dock=DockStyle.Fill; Margin=Padding.Empty; FlatStyle=FlatStyle.Flat; FlatAppearance.BorderSize=0;
            UseVisualStyleBackColor=false; BackColor=Color.FromArgb(247,248,245);
            AccessibleName=action=="close"?"关闭窗口":action=="maximize"?"最大化窗口":"最小化窗口";
            Click+=(s,e)=>clicked();
            MouseEnter+=(s,e)=> { hovered=true; Invalidate(); };
            MouseLeave+=(s,e)=> { hovered=false; Invalidate(); };
        }
        protected override void OnPaint(PaintEventArgs e)
        {
            bool red=hovered && action=="close";
            e.Graphics.Clear(red?Color.FromArgb(196,43,28):hovered?Color.FromArgb(228,236,229):BackColor);
            float scale=DeviceDpi/96f,w=10*scale,h=9*scale,x=(ClientSize.Width-w)/2,y=(ClientSize.Height-h)/2;
            using(var pen=new Pen(red?Color.White:Color.FromArgb(66,88,76),Math.Max(1,scale)))
            {
                if(action=="close") { e.Graphics.DrawLine(pen,x,y,x+w,y+h); e.Graphics.DrawLine(pen,x+w,y,x,y+h); }
                else if(action=="minimize") e.Graphics.DrawLine(pen,x,y+h/2,x+w,y+h/2);
                else if(maximized())
                {
                    e.Graphics.DrawRectangle(pen,x+2*scale,y,w-2*scale,h-2*scale);
                    using(var background=new SolidBrush(hovered?Color.FromArgb(228,236,229):BackColor))
                        e.Graphics.FillRectangle(background,x,y+2*scale,w-2*scale,h-2*scale);
                    e.Graphics.DrawRectangle(pen,x,y+2*scale,w-2*scale,h-2*scale);
                }
                else e.Graphics.DrawRectangle(pen,x,y,w,h);
            }
            if(Focused && ShowFocusCues) ControlPaint.DrawFocusRectangle(e.Graphics,new Rectangle(4,4,Width-8,Height-8));
        }
    }
}
