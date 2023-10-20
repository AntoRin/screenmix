import { app, BrowserWindow, Menu, MenuItemConstructorOptions, Tray, autoUpdater, dialog } from "electron";
import { IpcHandler } from "./services/IpcHandler";

import ess from "electron-squirrel-startup";
import { PATHS, generalConfig } from "./constants";
import { VideoCaptureStatus } from "common-types";
import electronIsDev from "electron-is-dev";

if (ess) app.quit();

class Screenmix {
   private _mainWindow: BrowserWindow | undefined;
   private _ipcHandler: IpcHandler | undefined;
   private _tray: Tray | null = null;
   private _isQuitting: boolean = false;

   constructor() {}

   public async init(): Promise<void> {
      try {
         await app.whenReady();

         this._createMainWindow();

         if (!this._mainWindow) {
            throw new Error("Error creating window");
         }

         this._ipcHandler = new IpcHandler(this._mainWindow, app.getVersion());

         this._ipcHandler.on("exitApplication", this._setFlagAndExit.bind(this));

         this._ipcHandler.on("hideMainWindow", this._mainWindow.hide.bind(this._mainWindow));

         this._ipcHandler.on("showMainWindow", this._mainWindow.show.bind(this._mainWindow));

         app.on("activate", () => {
            if (BrowserWindow.getAllWindows().length === 0) {
               this._createMainWindow();
            }
         });

         this._ipcHandler.registerGlobalShortcuts();

         this._ipcHandler.initializeIpcListeners();

         this._initializeTray();

         this._setupAutoUpdater();

         app.on("window-all-closed", () => {
            if (process.platform !== "darwin") app.quit();
         });

         app.on("will-quit", () => {
            if (this._ipcHandler) {
               this._ipcHandler.unregisterGlobalShortcuts();
            }
         });
      } catch (error) {
         throw error;
      }
   }

   private _setupAutoUpdater() {
      if (electronIsDev) return;

      autoUpdater.setFeedURL({
         url: `${generalConfig.updateServerUrl}/${app.getVersion()}`,
      });

      autoUpdater.on("checking-for-update", async () => {
         await dialog.showMessageBox({
            message: "Checking for update",
         });
      });

      autoUpdater.on("error", async e => {
         await dialog.showMessageBox({
            message: JSON.stringify(e),
         });
      });

      autoUpdater.on("update-available", async () => {
         await dialog.showMessageBox({
            message: "update-available",
         });
      });

      autoUpdater.on("update-not-available", async () => {
         await dialog.showMessageBox({
            message: "update-not-available",
         });
      });

      autoUpdater.on("update-downloaded", async () => {
         await dialog.showMessageBox({
            message: "update-downloaded",
         });
      });

      autoUpdater.on("before-quit-for-update", async () => {
         await dialog.showMessageBox({
            message: "before-quit-for-update",
         });
      });

      setTimeout(() => {
         // If update-availability needs to be checked for automatically, it needs to be after sometime since the app has started. Checking for updates requires some resources that might be in use by other services on start-up.
         autoUpdater.checkForUpdates();
      }, 20000);
   }

   private _createMainWindow(): void {
      this._mainWindow = new BrowserWindow({
         width: 1280,
         height: 720,
         webPreferences: {
            devTools: electronIsDev,
            preload: PATHS.preload,
            contextIsolation: true,
         },
         icon: PATHS.icons.jpeg,
         title: "screenmix",
         backgroundColor: "#000",
      });

      this._mainWindow.loadFile(PATHS.targetHtml);

      if (!electronIsDev) this._mainWindow.removeMenu();

      this._mainWindow.setMinimumSize(640, 480);

      this._mainWindow.on("close", event => {
         if (this._isQuitting) return true;

         event.preventDefault();
         this._mainWindow?.hide();
         return false;
      });
   }

   private _initializeTray(): void {
      if (!this._ipcHandler || !this._mainWindow) return;

      this._tray = new Tray(PATHS.icons.jpeg);

      this._tray.setToolTip("screenmix");

      this._tray.on("click", this._mainWindow.show.bind(this._mainWindow));

      this._tray.setContextMenu(Menu.buildFromTemplate(this._generateTrayCtxMenu()));

      this._ipcHandler.on("videoCaptureStatusChange", (status: VideoCaptureStatus) => {
         this._tray?.setContextMenu(Menu.buildFromTemplate(this._generateTrayCtxMenu(status)));
      });
   }

   private _generateTrayCtxMenu(videoCaptureStatus?: VideoCaptureStatus): MenuItemConstructorOptions[] {
      if (!this._ipcHandler) return [];

      return [
         {
            label: "Take Screenshot",
            type: "normal",
            click: this._ipcHandler.takeScreenshot.bind(this._ipcHandler),
         },
         {
            label: !videoCaptureStatus || videoCaptureStatus === "videoCaptureEnd" ? "Start Recording" : "Stop Recording",
            type: "normal",
            click: this._ipcHandler.captureScreen.bind(this._ipcHandler),
         },
         {
            type: "separator",
         },
         {
            label: "Exit",
            type: "normal",
            click: this._setFlagAndExit.bind(this),
         },
      ];
   }

   private _setFlagAndExit() {
      this._isQuitting = true;
      app.quit();
   }
}

const screenmix: Screenmix = new Screenmix();

screenmix.init().catch(e => {
   console.log(e);
   process.exit(1);
});
