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
      selectBaseDirectory: async () =>
        await ipcRenderer.invoke("ipc:selectBaseDirectory"),
      getBaseDirectory: async () =>
        await ipcRenderer.invoke("ipc:getBaseDirectory"),
      getPreferencesSetStatus: async () =>
        await ipcRenderer.invoke("ipc:getPreferenceSetStatus"),
      listScreenshotPaths: async (baseDirectory: string) =>
        await ipcRenderer.invoke("ipc:listScreenshotPaths", baseDirectory),
      getDesktopSourceId: async () =>
        await ipcRenderer.invoke("ipc:getDesktopSourceId"),
      saveCapture: async (captureData: CaptureData) => {
        try {
          return await ipcRenderer.invoke(
            "ipc:saveCapturedScreenshot",
            captureData
          );
        } catch (error) {
          throw error;
        }
      },
      updateBaseDirectory: async (newDir: string) =>
        await ipcRenderer.invoke("ipc:updateBaseDirectory", newDir),
    };
  }
}

contextBridge.exposeInMainWorld(
  "rendererProcessctrl",
  new Preload().exposedApis
);
