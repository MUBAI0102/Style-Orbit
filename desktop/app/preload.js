"use strict";

const { contextBridge, ipcRenderer } = require("electron");

let initialLibrary = [];
let dataPath = "";
let appVersion = "";

try {
  initialLibrary = ipcRenderer.sendSync("library:load-sync") || [];
  dataPath = ipcRenderer.sendSync("app:data-path-sync") || "";
  appVersion = ipcRenderer.sendSync("app:version-sync") || "";
} catch (error) {
  console.error("Desktop bridge initialization failed:", error);
}

contextBridge.exposeInMainWorld("desktopAPI", {
  isDesktop: true,
  initialLibrary: Array.isArray(initialLibrary) ? initialLibrary : [],
  dataPath,
  appVersion,
  saveLibrary: (items) => ipcRenderer.invoke("library:save", items),
  openDataFolder: () => ipcRenderer.invoke("app:open-data-folder"),
});
