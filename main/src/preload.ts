import { contextBridge, ipcRenderer } from "electron";
import { IpcChannel, RendererExposedApi } from "./types";
import { Channels } from "./constants";

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

      fromMainEvents.forEach(eventName => ipcRenderer.on(eventName, () => window.postMessage(eventName)));
   }

   getExposedApis(): RendererExposedApi {
      return {
         invoke: (channel: IpcChannel, data?: any) => {
            return !Channels.includes(channel) ? undefined : data ? ipcRenderer.invoke(channel, data) : ipcRenderer.invoke(channel);
         },
      };
   }
}

contextBridge.exposeInMainWorld("rendererProcessCtrl", new Preload().getExposedApis());
