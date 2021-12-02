import { contextBridge, ipcRenderer } from "electron";
import { IpcEvents } from "./IpcEvents";
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
        await ipcRenderer.invoke(IpcEvents.SELECT_DIRECTORY),
      getBaseDirectory: async () =>
        await ipcRenderer.invoke(IpcEvents.GET_SELECTED_DIRECTORY),
      getPreferencesSetStatus: async () =>
        await ipcRenderer.invoke(IpcEvents.GET_PREFERENCES_SET_STATUS),
    };
  }
}

contextBridge.exposeInMainWorld(
  "rendererProcessctrl",
  new Preload().exposedApis
);
