"use strict";

const { app, BrowserWindow, Menu, dialog, ipcMain, nativeTheme, screen, shell } = require("electron");
const fs = require("fs");
const path = require("path");

const APP_NAME = "STYLE ORBIT";
const LIBRARY_SCHEMA = 1;
const MAX_LIBRARY_BYTES = 80 * 1024 * 1024;
const TEST_HIDDEN = Boolean(process.env.STYLE_ORBIT_TEST_HIDDEN);

app.setName(APP_NAME);
app.setAppUserModelId("com.styleorbit.desktop");
app.commandLine.appendSwitch("enable-unsafe-swiftshader");

const testDataDir = process.env.STYLE_ORBIT_DATA_DIR;
if (testDataDir) {
  app.setPath("userData", path.resolve(testDataDir));
}

let mainWindow = null;
let logPath = "";

function ensureDataDir() {
  const dir = path.dirname(libraryPath());
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function libraryPath() {
  return path.join(app.getPath("userData"), "library.json");
}

function log(message) {
  try {
    if (!logPath) {
      ensureDataDir();
      logPath = path.join(app.getPath("userData"), "startup.log");
    }
    fs.appendFileSync(
      logPath,
      `[${new Date().toISOString()}] ${message}\n`,
      "utf8"
    );
  } catch (error) {
    console.error("startup log failed", error);
  }
}

function reportError(title, error) {
  const message = error?.stack || error?.message || String(error);
  log(`${title}: ${message}`);
  try {
    if (app.isReady()) dialog.showErrorBox(title, message);
  } catch {
    /* noop */
  }
}

process.on("uncaughtException", (error) => reportError("STYLE / ORBIT 启动异常", error));
process.on("unhandledRejection", (error) => reportError("STYLE / ORBIT 未处理异常", error));

log(
  `starting electron=${process.versions.electron} node=${process.versions.node} exe=${process.execPath} args=${JSON.stringify(process.argv)}`
);

function readLibrary() {
  const file = libraryPath();
  if (!fs.existsSync(file)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    const items = Array.isArray(parsed) ? parsed : parsed?.items;
    if (!Array.isArray(items)) throw new Error("library items must be an array");
    return items;
  } catch (error) {
    console.error("Could not read local library:", error);
    try {
      const backup = `${file}.broken-${Date.now()}`;
      fs.renameSync(file, backup);
      console.error("Corrupt library moved to", backup);
    } catch (backupError) {
      console.error("Could not back up corrupt library:", backupError);
    }
    return [];
  }
}

function writeLibrary(items) {
  if (!Array.isArray(items)) throw new Error("Library payload must be an array.");
  if (items.length > 800) throw new Error("本地库条目过多，请先删除一些条目。");
  const payload = JSON.stringify(
    {
      schemaVersion: LIBRARY_SCHEMA,
      updatedAt: new Date().toISOString(),
      items,
    },
    null,
    2
  );
  if (Buffer.byteLength(payload, "utf8") > MAX_LIBRARY_BYTES) {
    throw new Error("本地库超过 80MB，请减小示例图片或删除部分条目。");
  }
  const file = libraryPath();
  ensureDataDir();
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, payload, "utf8");
  try {
    fs.renameSync(temp, file);
  } catch (renameError) {
    fs.copyFileSync(temp, file);
    fs.rmSync(temp, { force: true });
  }
  return file;
}

function openExternal(url) {
  if (/^https?:\/\//i.test(String(url || ""))) {
    shell.openExternal(url).catch((error) => console.error("openExternal failed", error));
  }
}

function createWindow() {
  nativeTheme.themeSource = "dark";
  const icon = path.join(__dirname, "icon.png");
  const workArea = screen.getPrimaryDisplay().workAreaSize;
  const windowWidth = Math.max(980, Math.min(1480, workArea.width - 80));
  const windowHeight = Math.max(650, Math.min(940, workArea.height - 80));
  log(
    `creating window ${windowWidth}x${windowHeight} workArea=${workArea.width}x${workArea.height} hidden=${TEST_HIDDEN}`
  );
  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: 980,
    minHeight: 650,
    center: true,
    show: !TEST_HIDDEN,
    title: "STYLE / ORBIT",
    backgroundColor: "#06070a",
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
      backgroundThrottling: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.once("ready-to-show", () => {
    log("window ready-to-show");
    if (!TEST_HIDDEN && !mainWindow.isVisible()) mainWindow.show();
  });

  // Fallback: never let a renderer/GPU hiccup leave the app as an invisible
  // process. The window is already shown, but this also covers slow platforms.
  if (!TEST_HIDDEN) {
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
        log("window visibility fallback triggered");
        mainWindow.show();
      }
    }, 1800);
  }

  mainWindow.webContents.on("did-finish-load", () => log("renderer did-finish-load"));
  mainWindow.webContents.on("did-fail-load", (_event, code, description, url, isMainFrame) => {
    if (!isMainFrame) return;
    const message = `页面加载失败 (${code}) ${description}\n${url}`;
    log(message);
    try {
      dialog.showErrorBox("STYLE / ORBIT 加载失败", `${message}\n\n请确认已解压完整压缩包。`);
    } catch {
      /* noop */
    }
  });
  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    reportError("STYLE / ORBIT 渲染进程退出", details);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    // The app is a local file. Allow file:// reloads/hash changes, send every
    // external link to the user's default browser instead.
    if (String(url).startsWith("file://")) return;
    event.preventDefault();
    openExternal(url);
  });

  mainWindow.webContents.on("will-attach-webview", (event) => {
    event.preventDefault();
  });

  mainWindow.on("closed", () => {
    log("window closed");
    mainWindow = null;
  });

  const indexPath = path.join(__dirname, "ui", "index.html");
  log(`loading ${indexPath}`);
  mainWindow.loadFile(indexPath).catch((error) => {
    reportError("STYLE / ORBIT 无法加载页面", error);
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  ipcMain.on("library:load-sync", (event) => {
    event.returnValue = readLibrary();
  });

  ipcMain.on("app:data-path-sync", (event) => {
    event.returnValue = libraryPath();
  });

  ipcMain.on("app:version-sync", (event) => {
    event.returnValue = app.getVersion();
  });

  ipcMain.handle("library:save", (_event, items) => {
    try {
      const file = writeLibrary(items);
      return { ok: true, dataPath: file, count: items.length };
    } catch (error) {
      console.error("Library save failed:", error);
      return { ok: false, error: error.message || "写入本地库失败。" };
    }
  });

  ipcMain.handle("app:open-data-folder", async () => {
    try {
      const dir = ensureDataDir();
      const error = await shell.openPath(dir);
      return error ? { ok: false, error } : { ok: true, path: dir };
    } catch (error) {
      return { ok: false, error: error.message || "无法打开数据文件夹。" };
    }
  });

  app.whenReady().then(() => {
    log(
      `app ready version=${app.getVersion()} data=${app.getPath("userData")} log=${logPath}`
    );
    Menu.setApplicationMenu(null);
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
