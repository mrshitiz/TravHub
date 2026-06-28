using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Text.RegularExpressions;
using System.Windows.Forms;
using System.Collections.Generic;

namespace TravHubLauncher
{
    public class LauncherForm : Form
    {
        private Button btnStart;
        private Button btnStop;
        private Button btnRestart;
        private Button btnCopyNgrok;
        private RichTextBox txtLogs;
        
        private List<Process> runningProcesses = new List<Process>();
        private string basePath;

        public LauncherForm()
        {
            InitializeComponent();
            basePath = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ".."));
        }

        private void InitializeComponent()
        {
            this.Text = "TravHub Services Launcher";
            this.Size = new Size(800, 600);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormClosing += new FormClosingEventHandler(LauncherForm_FormClosing);

            Panel topPanel = new Panel();
            topPanel.Dock = DockStyle.Top;
            topPanel.Height = 50;
            topPanel.BackColor = Color.WhiteSmoke;
            this.Controls.Add(topPanel);

            btnStart = new Button();
            btnStart.Text = "Start All";
            btnStart.Location = new Point(10, 10);
            btnStart.Width = 100;
            btnStart.BackColor = Color.LightGreen;
            btnStart.Click += new EventHandler(BtnStart_Click);
            topPanel.Controls.Add(btnStart);

            btnStop = new Button();
            btnStop.Text = "Stop All";
            btnStop.Location = new Point(120, 10);
            btnStop.Width = 100;
            btnStop.BackColor = Color.LightCoral;
            btnStop.Enabled = false;
            btnStop.Click += new EventHandler(BtnStop_Click);
            topPanel.Controls.Add(btnStop);

            btnRestart = new Button();
            btnRestart.Text = "Restart All";
            btnRestart.Location = new Point(230, 10);
            btnRestart.Width = 100;
            btnRestart.BackColor = Color.LightGoldenrodYellow;
            btnRestart.Enabled = false;
            btnRestart.Click += new EventHandler(BtnRestart_Click);
            topPanel.Controls.Add(btnRestart);



            txtLogs = new RichTextBox();
            txtLogs.Dock = DockStyle.Fill;
            txtLogs.ReadOnly = true;
            txtLogs.BackColor = Color.Black;
            txtLogs.ForeColor = Color.LightGray;
            txtLogs.Font = new Font("Consolas", 10);
            this.Controls.Add(txtLogs);
            this.Controls.SetChildIndex(topPanel, 0);
        }

        private void Log(string message, Color color)
        {
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action<string, Color>(Log), new object[] { message, color });
                return;
            }

            if (color == Color.Empty) color = Color.LightGray;

            txtLogs.SelectionStart = txtLogs.TextLength;
            txtLogs.SelectionLength = 0;
            txtLogs.SelectionColor = color;
            txtLogs.AppendText(String.Format("[{0}] {1}\n", DateTime.Now.ToString("HH:mm:ss"), message));
            txtLogs.ScrollToCaret();
        }

        private void LogDefault(string message)
        {
            Log(message, Color.LightGray);
        }

        private void BtnStart_Click(object sender, EventArgs e)
        {
            StartServices();
        }

        private void BtnStop_Click(object sender, EventArgs e)
        {
            StopServices();
        }

        private void BtnRestart_Click(object sender, EventArgs e)
        {
            StopServices();
            System.Threading.Thread.Sleep(2000); // Wait for ports to clear
            StartServices();
        }

        private void StartServices()
        {
            btnStart.Enabled = false;
            btnStop.Enabled = true;
            btnRestart.Enabled = true;
            txtLogs.Clear();
            Log("Starting TravHub Services...", Color.Cyan);

            // 1. MongoDB
            string mongoPath = Path.Combine(basePath, "backend", "mongodb", "bin", "mongod.exe");
            string mongoDataPath = Path.Combine(basePath, "backend", "mongodb_data");
            StartProcess(mongoPath, String.Format("--dbpath \"{0}\"", mongoDataPath), "MongoDB", Color.LimeGreen, "");

            // 2. Node Backend
            string backendPath = Path.Combine(basePath, "backend");
            StartProcess("cmd.exe", "/c npm start", "Backend", Color.SkyBlue, backendPath);

            // 3. Expo PWA
            string mobilePath = Path.Combine(basePath, "mobile_app");
            StartProcess("cmd.exe", "/c npm run web", "Frontend", Color.Yellow, mobilePath);

            // 4. Cloudflare Tunnel
            string cfPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "cloudflared.exe");
            StartProcess(cfPath, "tunnel --url http://localhost:3000 run travhub_api", "Cloudflare", Color.MediumPurple, "");

            Log("All services requested to start.", Color.Cyan);
        }

        private void StartProcess(string fileName, string arguments, string name, Color logColor, string workingDir)
        {
            try
            {
                Process p = new Process();
                p.StartInfo.FileName = fileName;
                p.StartInfo.Arguments = arguments;
                p.StartInfo.UseShellExecute = false;
                p.StartInfo.RedirectStandardOutput = true;
                p.StartInfo.RedirectStandardError = true;
                p.StartInfo.CreateNoWindow = true;
                
                if (!string.IsNullOrEmpty(workingDir))
                {
                    p.StartInfo.WorkingDirectory = workingDir;
                }

                p.OutputDataReceived += (s, e) => { if (e.Data != null) Log(String.Format("[{0}] {1}", name, e.Data), logColor); };
                p.ErrorDataReceived += (s, e) => { if (e.Data != null) Log(String.Format("[{0} ERR] {1}", name, e.Data), Color.Red); };

                p.Start();
                p.BeginOutputReadLine();
                p.BeginErrorReadLine();

                runningProcesses.Add(p);
                Log(String.Format("Started {0} (PID: {1})", name, p.Id), Color.White);
            }
            catch (Exception ex)
            {
                Log(String.Format("Failed to start {0}: {1}", name, ex.Message), Color.Red);
            }
        }

        private void StopServices()
        {
            btnStart.Enabled = true;
            btnStop.Enabled = false;
            btnRestart.Enabled = false;

            Log("Stopping all services...", Color.Orange);
            
            foreach (var p in runningProcesses)
            {
                try
                {
                    if (!p.HasExited)
                    {
                        ProcessStartInfo psi = new ProcessStartInfo();
                        psi.FileName = "taskkill";
                        psi.Arguments = String.Format("/F /T /PID {0}", p.Id);
                        psi.CreateNoWindow = true;
                        psi.UseShellExecute = false;
                        Process pk = Process.Start(psi);
                        if (pk != null) pk.WaitForExit();
                    }
                }
                catch { }
            }
            runningProcesses.Clear();
            
            try 
            { 
                ProcessStartInfo psi = new ProcessStartInfo("taskkill", "/F /IM cloudflared.exe");
                psi.CreateNoWindow = true;
                psi.UseShellExecute = false;
                Process pk = Process.Start(psi);
                if (pk != null) pk.WaitForExit();
            } 
            catch { }
            
            Log("Services stopped.", Color.Orange);
        }



        private void LauncherForm_FormClosing(object sender, FormClosingEventArgs e)
        {
            StopServices();
        }

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new LauncherForm());
        }
    }
}
