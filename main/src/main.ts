import { app, BrowserWindow, Menu, MenuItemConstructorOptions, Tray } from "electron";
import { IpcHandler } from "./services/IpcHandler";

import ess from "electron-squirrel-startup";
import { PATHS } from "./constants";
import { VideoCaptureStatus } from "common-types";
import electronIsDev from "electron-is-dev";
import logger from "electron-log/main";

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

         // The handler for setExitFlag needs to be purely synchronous, since the emitting code depends on this being sync.
         this._ipcHandler.on("setExitFlag", this._setFlagAndExit.bind(this, true));

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

      this._mainWindow.on("close", (event) => {
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
            label:
               !videoCaptureStatus || videoCaptureStatus === "videoCaptureEnd" ? "Start Recording" : "Stop Recording",
            type: "normal",
            click: this._ipcHandler.captureScreen.bind(this._ipcHandler),
         },
         {
            type: "separator",
         },
         {
            label: "Exit",
            type: "normal",
            click: () => {
               this._setFlagAndExit();
            },
         },
      ];
   }

   private _setFlagAndExit(setFlagOnly: boolean = false) {
      this._isQuitting = true;
      if (setFlagOnly) return;
      app.quit();
   }
}

logger.initialize({ preload: true });

logger.errorHandler.startCatching({
   showDialog: true,
});

logger.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{processType}] [{level}] {text}";
logger.transports.file.sync = false;

if (!electronIsDev) logger.transports.console.level = false;

const screenmix: Screenmix = new Screenmix();

screenmix.init().catch((e) => {
   // Make it sync because the application is about to be crashed, and there won't be time to perform async calls.
   logger.transports.file.sync = true;
   logger.error("Cannot initialize Screenmix.", e);
   process.exit(1);
});
