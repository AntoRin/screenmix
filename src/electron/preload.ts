import { contextBridge, ipcRenderer } from "electron";
import { CaptureData, RendererProcessCtx } from "../common/types";

class Preload {
  constructor() {
    process.once("loaded", () => {
      window.addEventListener("message", async (event: MessageEvent) => {
        try {
        } catch (e) {}
      });
    });

    const fromMainEvents: string[] = [
      "fromMain:takeScreenshot",
      "fromMain:captureScreen",
      "fromMain:refreshGallery",
    ];

    fromMainEvents.forEach((eventName) =>
      ipcRenderer.on(eventName, () => window.postMessage(eventName))
    );
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
      saveEditedImage: (data: CaptureData) =>
        ipcRenderer.invoke("ipc:saveEditedImage", data),
      deleteMediaFiles: (files: string[]) =>
        ipcRenderer.invoke("ipc:deleteMediaFiles", files),
    };
  }
}

contextBridge.exposeInMainWorld(
  "rendererProcessctrl",
  new Preload().exposedApis
);
