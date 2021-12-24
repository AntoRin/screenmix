import { contextBridge, ipcRenderer } from "electron";
import { CaptureData, RendererProcessCtx } from "./types";

class Preload {
  constructor() {
    process.once("loaded", () => {
      window.addEventListener("message", async (event: MessageEvent) => {
        try {
        } catch (e) {}
      });
    });

    ipcRenderer.on("fromMain:takeScreenshot", () => {
      window.postMessage("fromMain:takeScreenshot");
    });

    ipcRenderer.on("fromMain:captureScreen", () => {
      window.postMessage("fromMain:captureScreen");
    });
  }

  get exposedApis(): RendererProcessCtx {
    return {
      selectBaseDirectory: () => ipcRenderer.invoke("ipc:selectBaseDirectory"),
      getDirectorySelection: () =>
        ipcRenderer.invoke("ipc:getDirectorySelection"),
      getBaseDirectory: () => ipcRenderer.invoke("ipc:getBaseDirectory"),
      listMediaPaths: (baseDirectory: string) =>
        ipcRenderer.invoke("ipc:listMediaPaths", baseDirectory),
      getDesktopSourceId: () => ipcRenderer.invoke("ipc:getDesktopSourceId"),
      saveCapture: (captureData: CaptureData) =>
        ipcRenderer.invoke("ipc:saveCapturedScreenshot", captureData),
      saveChanges: (data) => ipcRenderer.invoke("ipc:saveChanges", data),
      getAllPreferences: () => ipcRenderer.invoke("ipc:getAllPreferences"),
      registerGlobalShortcuts: () =>
        ipcRenderer.invoke("ipc:registerGlobalShortcuts"),
    };
  }
}

contextBridge.exposeInMainWorld(
  "rendererProcessctrl",
  new Preload().exposedApis
);
