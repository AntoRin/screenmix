import { contextBridge, ipcRenderer } from "electron";
import { IpcChannel, MainToRendererEvent, RendererExposedApi } from "common-types";
import { CHANNELS } from "./constants";

class Preload {
   constructor() {
      process.once("loaded", () => {
         window.addEventListener("message", async (event: MessageEvent) => {
            try {
            } catch (e) {}
         });
      });

      const fromMainEvents: MainToRendererEvent[] = [
         "fromMain:takeScreenshot",
         "fromMain:captureScreen",
         "fromMain:refreshGallery",
         "fromMain:newImage",
         "fromMain:newVideo",
         "fromMain:takeScreenshotOfCurrentWindow",
         "fromMain:captureCurrentScreen",
         "fromMain:preferencesUpdated",
      ];

      fromMainEvents.forEach(eventName =>
         ipcRenderer.on(eventName, () => window.postMessage(eventName))
      );
   }

   getExposedApis(): RendererExposedApi {
      return {
         invoke: async <T>(channel: IpcChannel, data?: any): Promise<T> => {
            try {
               if (!CHANNELS.includes(channel)) throw new Error("Invalid Channel");

               let response: any = data
                  ? ipcRenderer.invoke(channel, data)
                  : ipcRenderer.invoke(channel);

               if (response instanceof Promise) response = await response;

               const [error, result] = [response?.error, response?.result];

               if (error) {
                  throw error;
               }

               return result;
            } catch (error: any) {
               throw error;
            }
         },
      };
   }
}

contextBridge.exposeInMainWorld("rendererProcessCtrl", new Preload().getExposedApis());
