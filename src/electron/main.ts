import path from "path";
import { app, BrowserWindow, ipcMain, dialog } from "electron";

class MainProcess {
  private _mainWindow: BrowserWindow | undefined;

  constructor() {}

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

    ipcMain.handle(
      "ipc:selectDirectory",
      async (event, ...args) => await this._selectDirectory()
    );
  }

  private async _selectDirectory() {
    return await dialog.showOpenDialog(this._mainWindow!, {
      properties: ["openDirectory"],
    });
  }
}

const mainProcess: MainProcess = new MainProcess();

mainProcess.init();
