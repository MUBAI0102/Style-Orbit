using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Windows.Forms;

[assembly: System.Reflection.AssemblyTitle("STYLE / ORBIT")]
[assembly: System.Reflection.AssemblyDescription("STYLE / ORBIT desktop launcher")]
[assembly: System.Reflection.AssemblyProduct("STYLE / ORBIT")]
[assembly: System.Reflection.AssemblyFileVersion("1.0.1.0")]
[assembly: System.Reflection.AssemblyVersion("1.0.1.0")]

namespace StyleOrbitLauncher
{
    internal static class Program
    {
        [STAThread]
        private static void Main(string[] args)
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string runtimeDir = Path.Combine(baseDir, "runtime");
            string core = Path.Combine(runtimeDir, "STYLE-ORBIT-core.exe");
            string index = Path.Combine(runtimeDir, "resources", "app", "ui", "index.html");

            if (!File.Exists(core) || !File.Exists(index))
            {
                MessageBox.Show(
                    "STYLE / ORBIT 文件不完整。\r\n\r\n请先把整个 ZIP 右键“全部解压”，" +
                    "再从解压后的文件夹运行 STYLE-ORBIT.exe。\r\n" +
                    "不要从压缩包预览里直接运行，也不要只单独复制 exe。",
                    "STYLE / ORBIT",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return;
            }

            var arguments = new StringBuilder();
            arguments.Append("--no-sandbox --enable-unsafe-swiftshader");
            for (int i = 0; i < args.Length; i++)
            {
                arguments.Append(' ');
                arguments.Append(Quote(args[i]));
            }

            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = core,
                    Arguments = arguments.ToString(),
                    WorkingDirectory = baseDir,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                Process.Start(startInfo);
            }
            catch (Exception error)
            {
                MessageBox.Show(
                    "STYLE / ORBIT 启动失败：\r\n" + error.Message +
                    "\r\n\r\n启动日志通常位于：\r\n%APPDATA%\\STYLE ORBIT\\startup.log",
                    "STYLE / ORBIT",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }

        private static string Quote(string value)
        {
            if (String.IsNullOrEmpty(value)) return "\"\"";
            if (value.IndexOfAny(new[] { ' ', '\t', '\n', '\r', '"' }) < 0) return value;
            return "\"" + value.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"";
        }
    }
}
