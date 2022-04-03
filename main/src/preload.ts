import { contextBridge, ipcRenderer } from "electron";
import { IpcChannel, RendererExposedApi } from "common-types";
import { CHANNELS } from "./constants";

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
         "fromMain:enablePreviewPaneMode",
      ];

      fromMainEvents.forEach(eventName =>
         ipcRenderer.on(eventName, () => window.postMessage(eventName))
      );
   }

   getExposedApis(): RendererExposedApi {
      return {
         invoke: <T>(channel: IpcChannel, data?: any): Promise<T> => {
            if (!CHANNELS.includes(channel)) throw new Error("Invalid Channel");
            return data ? ipcRenderer.invoke(channel, data) : ipcRenderer.invoke(channel);
         },
      };
   }
}

contextBridge.exposeInMainWorld("rendererProcessCtrl", new Preload().getExposedApis());
