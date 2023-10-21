import { ChildProcess, spawn } from "child_process";
import EventEmitter from "events";
import { Dirent, promises as fsp, statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import activeWin from "active-win";
import {
   BrowserWindow,
   clipboard,
   desktopCapturer,
   dialog,
   globalShortcut,
   ipcMain,
   nativeImage,
   autoUpdater,
} from "electron";

// import electronIsDev from "electron-is-dev";

import {
   AppMetaData,
   AppUpdaterState,
   AppUpdateStatus,
   CaptureData,
   IpcApi,
   IpcChannel,
   MainProcessInternalEvent,
   MainToRendererEvent,
   MediaFile,
   RendererProcessCtx,
   ScreenData,
   UserDataStore,
   VideoCaptureStatus,
} from "common-types";
import { CHANNELS, generalConfig, PATHS } from "../constants";
import { Store } from "./Store";
import { MainCtxError } from "../errors/MainCtxError";
import { Utils } from "./Utils";
import { ERROR_CODE_MAP } from "../errors/error-codes";

export class IpcHandler extends EventEmitter implements RendererProcessCtx {
   private _store: Store;
   private _mainWindow: BrowserWindow;
   private _imageExtensions: string[];
   private _videoExtensions: string[];
   private _appUpdaterState: AppUpdaterState;
   public appVersion: string;

   constructor(mainWindow: BrowserWindow, appVersion: string) {
      super();
      this._store = new Store();
      this._mainWindow = mainWindow;
      this._imageExtensions = [".jpg", ".jpeg", ".png"];
      this._videoExtensions = [".mp4"];
      this.appVersion = appVersion;

      this._appUpdaterState = {
         status: "updateNotAvailable",
         error: null,
      };

      this.setupAppUpdater();
   }

   override emit(event: MainProcessInternalEvent, ...args: any[]) {
      return super.emit.apply(this, [event, ...args]);
   }

   override on(event: MainProcessInternalEvent, callback: (...args: any[]) => void) {
      super.on.apply(this, [event, callback]);
      return this;
   }

   override once(event: MainProcessInternalEvent, callback: (...args: any[]) => void) {
      super.once.apply(this, [event, callback]);
      return this;
   }

   public initializeIpcListeners() {
      CHANNELS.forEach((channel: IpcChannel) => {
         ipcMain.handle(channel, async (e, ...args: any[]) => {
            try {
               const method: IpcApi = channel.split(":")[1] as IpcApi;

               if (!this[method] || typeof this[method] !== "function") {
                  throw new Error("Handler not registered");
               }

               let result = (this[method] as Function).apply(this, args);

               if (result instanceof Promise) result = await result;

               return { error: null, result };
            } catch (error: any) {
               return {
                  error: Utils.serializeError(error),
                  result: null,
               };
            }
         });
      });
   }

   setupAppUpdater() {
      autoUpdater.setFeedURL({
         url: `${generalConfig.updateServerUrl}/${this.appVersion}`,
      });

      autoUpdater.on("error", (e) => {
         this._appUpdaterState.status = "updateError";
         this._appUpdaterState.error = Utils.serializeError(e);
         this._notifyRenderer("fromMain:appUpdater:stateChange");
      });

      autoUpdater.on("checking-for-update", () => {
         this._appUpdaterState.status = "checkingForUpdate";
         this._notifyRenderer("fromMain:appUpdater:stateChange");
      });

      autoUpdater.on("update-available", () => {
         this._appUpdaterState.status = "updateAvailable";
         this._notifyRenderer("fromMain:appUpdater:stateChange");
      });

      autoUpdater.on("update-not-available", () => {
         this._appUpdaterState.status = "updateNotAvailable";
         this._notifyRenderer("fromMain:appUpdater:stateChange");
      });

      autoUpdater.on("update-downloaded", () => {
         this._appUpdaterState.status = "updateDownloaded";
         this._notifyRenderer("fromMain:appUpdater:stateChange");
      });

      autoUpdater.on("before-quit-for-update", () => {});
   }

   checkForAppUpdates() {
      if (
         !(["checkingForUpdate", "updateAvailable", "updateDownloaded"] as AppUpdateStatus[]).includes(
            this._appUpdaterState.status
         )
      ) {
         autoUpdater.checkForUpdates();
      }
   }

   getAppUpdaterState() {
      return this._appUpdaterState;
   }

   quitAndInstallUpdate() {
      // The handler of this particular event needs to be synchronous all the way.
      this.emit("setExitFlag");
      autoUpdater.quitAndInstall();
   }

   getAppMetaData(): AppMetaData {
      return {
         appVersion: this.appVersion,
         releaseNotesUrl: `${generalConfig.releaseNotesBaseUrl}/v${this.appVersion}`,
         licenseUrl: generalConfig.licenseUrl,
         lastCheckedForUpdateAt: Date.now(),
         icon: path.join("file:///", PATHS.icons.jpeg),
      };
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

   /**
    *
    * @returns The directory selected by user from the file explorer.
    */
   async getDirectorySelection() {
      return (await this._selectDirectories())[0];
   }

   async setBaseDirectory(dir: string) {
      try {
         await this._store.write({
            baseDirectory: dir,
         });

         this._notifyRenderer("fromMain:preferencesUpdated");
      } catch (error) {
         throw error;
      }
   }

   async addMediaDirectory(directoryName?: string) {
      const selectedDir = directoryName ? directoryName : await this.getDirectorySelection();

      if (selectedDir) {
         // User has successfully selected a directory
         const prevDirs: string[] = this._store.read("mediaDirectories");

         if (!prevDirs.includes(selectedDir)) {
            await this._store.write({
               mediaDirectories: [selectedDir, ...prevDirs],
            });

            this._notifyRenderer("fromMain:preferencesUpdated");
         }
      }

      return selectedDir;
   }

   async removeMediaDirectory(path: string) {
      try {
         await this._store.write({
            mediaDirectories: (this._store.read("mediaDirectories") as string[]).filter((p) => p !== path),
         });

         if (this._store.read("baseDirectory") === path) {
            await this._store.write({
               baseDirectory: null,
            });
         }

         this._notifyRenderer("fromMain:preferencesUpdated");
      } catch (error) {
         throw error;
      }
   }

   getBaseDirectory(): string | undefined {
      try {
         return this._store.read("baseDirectory");
      } catch (error) {
         throw error;
      }
   }

   getMediaDirectories(): string[] {
      try {
         return this._store.read("mediaDirectories") || [];
      } catch (error) {
         throw error;
      }
   }

   async saveChanges(data: UserDataStore) {
      try {
         await this._store.write(data);
         this._notifyRenderer("fromMain:preferencesUpdated");
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
            baseDirectory = this._store.read("baseDirectory") as string;
         }

         if (!baseDirectory) return [];

         const files = this._createSortedMediaFileList(
            await fsp.readdir(baseDirectory, {
               withFileTypes: true,
            }),
            baseDirectory
         );

         return files;
      } catch (error: any) {
         if (error?.code === "ENOENT" && baseDirectory) {
            await this.removeMediaDirectory(baseDirectory);
            throw new MainCtxError(ERROR_CODE_MAP.MP_ENOENT_BASE_DIR(baseDirectory), "MP_ENOENT_BASE_DIR");
         } else {
            throw error;
         }
      }
   }

   private _createSortedMediaFileList(dirents: Dirent[], baseDirectory: string): MediaFile[] {
      let files: MediaFile[] = [];

      for (const dirent of dirents) {
         try {
            if (
               dirent.isFile() &&
               (this._imageExtensions.includes(path.extname(dirent.name).toLowerCase()) ||
                  this._videoExtensions.includes(path.extname(dirent.name).toLowerCase()))
            ) {
               const mediaFile: MediaFile = {
                  name: path.basename(dirent.name),
                  path: path.join("file:///", baseDirectory, dirent.name),
                  type: this._imageExtensions.includes(path.extname(dirent.name).toLowerCase()) ? "image" : "video",
                  createdAt: statSync(path.join(baseDirectory, dirent.name)).birthtime.getTime(),
               };

               let idx = 0;

               do {
                  if (mediaFile.createdAt >= (files[idx]?.createdAt || Number.NEGATIVE_INFINITY)) {
                     files.splice(idx, 0, mediaFile);
                     break;
                  }

                  idx++;
               } while (idx <= files.length);
            }
         } catch (error: any) {
            if (error.code !== "ENOENT") {
               throw error;
            }
         }
      }

      return files;
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
                    return sources.find((s) => s.id.indexOf(String(activeSource.id)) !== -1);
                 } catch (error) {
                    return undefined;
                 }
              })()
            : sources.find((s) => s.name === "Entire Screen");

         return requiredSource?.id;
      } catch (error) {
         throw error;
      }
   }

   async getAvailableScreens(): Promise<ScreenData[]> {
      return (
         await desktopCapturer.getSources({
            types: ["window", "screen"],
         })
      ).map((source) => ({
         id: source.id,
         name: source.name,
         thumbnail: source.thumbnail.toDataURL(),
      }));
   }

   private _notifyRenderer(notification: MainToRendererEvent) {
      if (!this._mainWindow) return;
      this._mainWindow.webContents.send(notification);
   }

   async saveCapture(captureData: CaptureData) {
      try {
         const base64Data = captureData.dataUrl.split(";base64,")[1];

         let baseDir = this._store.read("baseDirectory");

         if (!baseDir) {
            baseDir = await this.getDirectorySelection();

            if (!baseDir) {
               // User has cancelled directory selection
               return;
            }

            await this._store.write({
               baseDirectory: baseDir,
            });

            await this.addMediaDirectory(baseDir);

            this._notifyRenderer("fromMain:preferencesUpdated");
         }

         const fileName =
            captureData.mode === "image"
               ? captureData.name || String(Date.now()) + ".png"
               : captureData.name || String(Date.now()) + ".mp4";

         await fsp.writeFile(path.join(baseDir, fileName), base64Data, {
            encoding: "base64",
         });

         const notification = captureData.mode === "image" ? "fromMain:newImage" : "fromMain:newVideo";

         this._notifyRenderer(notification);
      } catch (error) {
         throw error;
      }
   }

   async saveEditedImage(imageData: CaptureData) {
      try {
         if (imageData.mode !== "image") throw new Error("INVALID_CAPTURE_MODE");

         if (!imageData.name) throw new Error("INVALID_IMAGE_NAME");

         await this.saveCapture(imageData);
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
