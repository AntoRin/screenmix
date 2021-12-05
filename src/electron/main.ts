import path from "path";
import { app, BrowserWindow, ipcMain } from "electron";
import { Store } from "./services/Store";
import { IpcHandler } from "./services/IpcHandler";

class Screenmix {
  private _mainWindow: BrowserWindow | undefined;
  private _store: Store;
  private _ipcHandler: IpcHandler;

  constructor() {
    this._store = new Store();
    this._ipcHandler = new IpcHandler(this._store);
  }

  public init(): void {
    app.whenReady().then(() => {
      this._createMainWindow();

      app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this._createMainWindow();
        }
      });

      this._initializeIpcListeners();
    });

    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") app.quit();
    });

    app.commandLine.appendSwitch("ignore-certificate-errors");
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

  private _initializeIpcListeners(): void {
    if (!this._mainWindow) throw new Error("NO_WINDOW");

    ipcMain.handle("ipc:selectBaseDirectory", async (event, ...args) => {
      if (!this._mainWindow) return;
      return await this._ipcHandler.selectBaseDirectory(this._mainWindow);
    });

    ipcMain.handle(
      "ipc:getBaseDirectory",
      async (event, ...args) => await this._ipcHandler.getBaseDirectory()
    );

    ipcMain.handle(
      "ipc:getPreferenceSetStatus",
      async (event, ...args) => await this._ipcHandler.getPreferencesSetStatus()
    );

    ipcMain.handle(
      "ipc:listScreenshotPaths",
      async (event, arg) => await this._ipcHandler.listScreenshotPaths(arg)
    );

    ipcMain.handle(
      "ipc:getDesktopSourceId",
      async (event, ...args) => await this._ipcHandler.getDesktopSourceId()
    );

    ipcMain.handle(
      "ipc:saveCapturedScreenshot",
      async (event, data) => await this._ipcHandler.saveCapture(data)
    );
  }
}

const screenmix: Screenmix = new Screenmix();

screenmix.init();
