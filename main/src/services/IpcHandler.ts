import path from "path";
import { fileURLToPath } from "url";
import { BrowserWindow, dialog, desktopCapturer, globalShortcut, ipcMain, nativeImage, clipboard } from "electron";
import {
   CaptureData,
   IpcApi,
   IpcChannel,
   MainProcessInternalEvent,
   MediaFile,
   RendererProcessCtx,
   UserDataStore,
   VideoCaptureStatus,
} from "common-types";
import { Store } from "./Store";
import { Dirent, promises as fsp, statSync } from "fs";
import activeWin from "active-win";
import { Channels } from "../constants";
import EventEmitter from "events";
import { ChildProcess, spawn } from "child_process";

export class IpcHandler extends EventEmitter implements RendererProcessCtx {
   private _store: Store;
   private _mainWindow: BrowserWindow;
   private _imageExtensions: string[];
   private _videoExtensions: string[];

   constructor(mainWindow: BrowserWindow) {
      super();
      this._store = new Store();
      this._mainWindow = mainWindow;
      this._imageExtensions = [".jpg", ".jpeg", ".png"];
      this._videoExtensions = [".mp4"];
   }

   override emit(event: MainProcessInternalEvent, ...args: any[]) {
      return super.emit.apply(this, [event, ...args]);
   }

   override on(event: MainProcessInternalEvent, callback: (...args: any[]) => void) {
      super.on.apply(this, [event, callback]);
      return this;
   }

   public initializeIpcListeners() {
      Channels.forEach((channel: IpcChannel) => {
         ipcMain.handle(channel, (e, ...args: any[]) => {
            const method: IpcApi = channel.split(":")[1] as IpcApi;

            if (!this[method] || typeof this[method] !== "function") {
               throw new Error("Handler not registered");
            }

            return (this[method] as Function).apply(this, args);
         });
      });
   }

   registerGlobalShortcuts() {
      try {
         this.unregisterGlobalShortcuts();

         const ssHotKey: string = this._store.read("ssHotKey");
         const scHotKey: string = this._store.read("scHotKey");
         const ssHotKeyCurrentWindow: string = this._store.read("ssHotKeyCurrentWindow");
         const scHotKeyCurrentWindow: string = this._store.read("scHotKeyCurrentWindow");

         globalShortcut.registerAll([ssHotKey], () => {
            this.takeScreenshot();
         });
         globalShortcut.registerAll([scHotKey], () => {
            this.captureScreen();
         });
         globalShortcut.registerAll([ssHotKeyCurrentWindow], () => {
            this.takeScreenshotOfCurrentWindow();
         });
         globalShortcut.registerAll([scHotKeyCurrentWindow], () => {
            this.captureCurrentScreen();
         });
      } catch (error) {
         throw error;
      }
   }

   unregisterGlobalShortcuts() {
      return globalShortcut.unregisterAll();
   }

   async getDirectorySelection() {
      return (await this._selectDirectories())[0];
   }

   async setBaseDirectory(dir: string) {
      try {
         this._store.write({
            baseDirectory: dir,
         });
      } catch (error) {
         throw error;
      }
   }

   async addMediaDirectory() {
      const [selectedDir] = await this._selectDirectories();

      if (selectedDir) {
         const prevDirs: string[] = this._store.read("mediaDirectories");

         if (!prevDirs.includes(selectedDir)) {
            await this._store.write({
               mediaDirectories: [selectedDir, ...prevDirs],
            });
         }
      }

      return selectedDir;
   }

   async removeMediaDirectory(path: string) {
      try {
         await this._store.write({
            mediaDirectories: (this._store.read("mediaDirectories") as string[]).filter(p => p !== path),
         });

         if (this._store.read("baseDirectory") === path) {
            await this._store.write({
               baseDirectory: null,
            });
         }
      } catch (error) {
         throw error;
      }
   }

   async getBaseDirectory() {
      try {
         return this._store.read("baseDirectory");
      } catch (error) {
         throw error;
      }
   }

   async getMediaDirectories() {
      try {
         return this._store.read("mediaDirectories");
      } catch (error) {
         throw error;
      }
   }

   async saveChanges(data: UserDataStore) {
      try {
         await this._store.write(data);
      } catch (error) {
         throw error;
      }
   }

   async getAllPreferences() {
      return this._store.read(undefined);
   }

   async listMediaPaths(baseDirectory?: string): Promise<MediaFile[]> {
      try {
         if (!baseDirectory) {
            baseDirectory = this._store.read("baseDirectory");
         }

         if (!baseDirectory) return [];

         let files: string[] = [];

         try {
            const directoryContents: Dirent[] = await fsp.readdir(baseDirectory!, {
               withFileTypes: true,
            });

            for (const fileData of directoryContents) {
               if (
                  fileData.isFile() &&
                  (this._imageExtensions.includes(path.extname(fileData.name).toLowerCase()) ||
                     this._videoExtensions.includes(path.extname(fileData.name).toLowerCase()))
               ) {
                  files.push(path.join(baseDirectory!, fileData.name));
               }
            }
         } catch (error: any) {
            if (error.code !== "ENOENT") {
               throw error;
            }
         }

         this._sortFilePathsBasedOnBirthTime(files);

         return files.map(f => ({
            name: path.basename(f),
            path: path.join("file:///", f),
            type: this._imageExtensions.includes(path.extname(f).toLowerCase()) ? "image" : "video",
         }));
      } catch (error) {
         throw error;
      }
   }

   private _sortFilePathsBasedOnBirthTime(filePaths: string[]) {
      try {
         filePaths.sort((filePath1, filePath2) => {
            const file1Time = statSync(filePath1).birthtime.getTime();
            const file2Time = statSync(filePath2).birthtime.getTime();

            return file1Time > file2Time ? -1 : file2Time > file1Time ? 1 : 0;
         });
      } catch (error) {
         throw error;
      }
   }

   public takeScreenshot() {
      this._mainWindow.webContents.send("fromMain:takeScreenshot");
   }

   public takeScreenshotOfCurrentWindow() {
      this._mainWindow.webContents.send("fromMain:takeScreenshotOfCurrentWindow");
   }

   public captureScreen() {
      this._mainWindow.webContents.send("fromMain:captureScreen");
   }

   public captureCurrentScreen() {
      this._mainWindow.webContents.send("fromMain:captureCurrentScreen");
   }

   private async _selectDirectories(): Promise<string[]> {
      try {
         const dialogResponse = await dialog.showOpenDialog(this._mainWindow, {
            properties: ["openDirectory"],
         });

         if (dialogResponse.canceled) return [];

         return dialogResponse.filePaths;
      } catch (error) {
         throw error;
      }
   }

   async getDesktopSourceId(currentWindow: boolean = false) {
      try {
         const sources = await desktopCapturer.getSources({
            types: ["window", "screen"],
         });

         const requiredSource = currentWindow
            ? await (async () => {
                 try {
                    const activeSource = await activeWin();
                    if (!activeSource) return undefined;
                    return sources.find(s => s.id.indexOf(String(activeSource.id)) !== -1);
                 } catch (error) {
                    return undefined;
                 }
              })()
            : sources.find(s => s.name === "Entire Screen");

         return requiredSource?.id;
      } catch (error) {
         throw error;
      }
   }

   private _notifyRenderer(notification: string) {
      if (!this._mainWindow) return;
      this._mainWindow.webContents.send(notification);
   }

   async saveCapture(captureData: CaptureData, notify: boolean = true) {
      try {
         const base64Data = captureData.dataUrl.split(";base64,")[1];

         const baseDir = this._store.read("baseDirectory");

         const fileName =
            captureData.mode === "image"
               ? captureData.name || String(Date.now()) + ".png"
               : captureData.name || String(Date.now()) + ".mp4";

         await fsp.writeFile(path.join(baseDir, fileName), base64Data, {
            encoding: "base64",
         });

         const notification = captureData.mode === "image" ? "fromMain:newImage" : "fromMain:newVideo";

         if (notify) this._notifyRenderer(notification);
      } catch (error) {
         throw error;
      }
   }

   async saveEditedImage(imageData: CaptureData) {
      try {
         if (imageData.mode !== "image") throw new Error("INVALID_CAPTURE_MODE");

         if (!imageData.name) throw new Error("INVALID_IMAGE_NAME");

         await this.saveCapture(imageData, true);
      } catch (error) {
         throw error;
      }
   }

   async deleteMediaFiles(files: string[]) {
      try {
         const dir = this._store.read("baseDirectory");

         if (!dir) return;

         for (const file of files) {
            try {
               const filePath = path.join(dir, file);
               await fsp.unlink(filePath);
            } catch (error) {}
         }

         this._notifyRenderer("fromMain:refreshGallery");
      } catch (error) {
         throw error;
      }
   }

   async copyImageToClipboard(file: MediaFile) {
      try {
         const image = nativeImage.createFromPath(fileURLToPath(file.path));
         clipboard.writeImage(image);
      } catch (error) {
         throw error;
      }
   }

   async handleVideoCaptureStatusChange(status: VideoCaptureStatus) {
      this.emit("videoCaptureStatusChange", status);
   }

   async openBaseDirectory() {
      try {
         await new Promise<void>((resolve, reject) => {
            const proc: ChildProcess = spawn("explorer", [this._store.read("baseDirectory")], {
               stdio: ["pipe", "pipe", "pipe"],
               detached: false,
               windowsHide: true,
               shell: true,
            });

            let promiseEnded: boolean = false;

            proc
               .on("error", (error: Error) => {
                  if (!promiseEnded) {
                     reject(error);
                     promiseEnded = true;
                  }
               })
               .on("close", () => {
                  if (!promiseEnded) {
                     resolve();
                     promiseEnded = true;
                  }
               });
         });
      } catch (error) {
         throw error;
      }
   }

   exitApplication() {
      this.emit("exitApplication");      
   }
}
