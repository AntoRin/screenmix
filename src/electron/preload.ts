import { contextBridge, ipcRenderer } from "electron";
import { RendererProcessCtx } from "./types";

const exposedApis: RendererProcessCtx = {
  selectDirectory: async () => {
    return await ipcRenderer.invoke("ipc:selectDirectory");
  },
};

contextBridge.exposeInMainWorld("rendererProcessctrl", exposedApis);

process.once("loaded", () => {
  window.addEventListener("message", async (event: MessageEvent) => {
    try {
    } catch (e) {}
  });
});
