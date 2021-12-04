import { contextBridge, ipcRenderer } from "electron";
import { RendererProcessCtx } from "./types";

class Preload {
  constructor() {
    process.once("loaded", () => {
      window.addEventListener("message", async (event: MessageEvent) => {
        try {
        } catch (e) {}
      });
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
    };
  }
}

contextBridge.exposeInMainWorld(
  "rendererProcessctrl",
  new Preload().exposedApis
);
