import { contextBridge, ipcRenderer } from "electron";
import { CaptureData, MediaFile, RendererProcessCtx } from "../common/types";

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
      "fromMain:newImage",
      "fromMain:newVideo",
      "fromMain:takeScreenshotOfCurrentWindow",
      "fromMain:captureCurrentScreen",
    ];

    fromMainEvents.forEach((eventName) =>
      ipcRenderer.on(eventName, () => window.postMessage(eventName))
    );
  }

  get exposedApis(): RendererProcessCtx {
    return {
      addMediaDirectory: () => ipcRenderer.invoke("ipc:addMediaDirectory"),
      removeMediaDirectory: (path: string) =>
        ipcRenderer.invoke("ipc:removeMediaDirectory", path),
      getDirectorySelection: () =>
        ipcRenderer.invoke("ipc:getDirectorySelection"),
      getBaseDirectory: () => ipcRenderer.invoke("ipc:getBaseDirectory"),
      setBaseDirectory: (dir: string) =>
        ipcRenderer.invoke("ipc:setBaseDirectory", dir),
      getMediaDirectories: () => ipcRenderer.invoke("ipc:getMediaDirectories"),
      listMediaPaths: (baseDirectory: string) =>
        ipcRenderer.invoke("ipc:listMediaPaths", baseDirectory),
      getDesktopSourceId: (currentWindow?: boolean) =>
        ipcRenderer.invoke("ipc:getDesktopSourceId", currentWindow),
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
      copyImageToClipboard: (file: MediaFile) =>
        ipcRenderer.invoke("ipc:copyImageToClipboard", file),
    };
  }
}

contextBridge.exposeInMainWorld(
  "rendererProcessctrl",
  new Preload().exposedApis
);
