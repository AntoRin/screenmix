import path from "path";
import { app, BrowserWindow } from "electron";
import { IpcHandler } from "./services/IpcHandler";

import ess from "electron-squirrel-startup";

if (ess) app.quit();

class Screenmix {
  private _mainWindow: BrowserWindow | undefined;
  private _ipcHandler: IpcHandler;

  constructor() {
    this._ipcHandler = new IpcHandler();
  }

  public async init(): Promise<void> {
    try {
      await app.whenReady();
      this._createMainWindow();

      app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this._createMainWindow();
        }
      });

      await this._ipcHandler.registerGlobalShortcuts(this._mainWindow);

      this._ipcHandler.initializeIpcListeners(this._mainWindow);

      app.on("window-all-closed", () => {
        if (process.platform !== "darwin") app.quit();
      });

      app.on("will-quit", () => {
        this._ipcHandler.unregisterGlobalShortcuts();
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
        devTools: true,
        preload: path.join(__dirname, "preload"),
        contextIsolation: true,
      },
    });

    this._mainWindow.loadFile(path.join(__dirname, "../index.html"));
  }
}

const screenmix: Screenmix = new Screenmix();

screenmix.init().catch((e) => {
  process.exit(1);
});
