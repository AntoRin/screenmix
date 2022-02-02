import {
  app,
  BrowserWindow,
  Menu,
  MenuItemConstructorOptions,
  Tray,
} from "electron";
import { IpcHandler } from "./services/IpcHandler";

import ess from "electron-squirrel-startup";
import { Paths } from "./constants";
import { VideoCaptureStatus } from "../common/types";
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

      if (!this._mainWindow) throw new Error("Error creating window");

      this._ipcHandler = new IpcHandler(this._mainWindow);

      app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this._createMainWindow();
        }
      });

      this._ipcHandler.registerGlobalShortcuts();

      this._ipcHandler.initializeIpcListeners();

      this._createTray();

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
        preload: Paths.preload,
        contextIsolation: true,
      },
      icon: Paths.icons.jpeg,
      title: "screenmix",
      backgroundColor: "#000",
    });

    this._mainWindow.loadFile(Paths.targetHtml);

    this._mainWindow.removeMenu();

    this._mainWindow.on("close", (event) => {
      if (this._isQuitting) return true;

      event.preventDefault();
      this._mainWindow?.hide();
      return false;
    });
  }

  private _createTray() {
    if (!this._ipcHandler || !this._mainWindow) return;

    this._tray = new Tray(
      path.join(__dirname, "../assets", "logo", "logo_jpeg.jpeg")
    );

    const ctxMenu = Menu.buildFromTemplate([
      {
        label: "Take Screenshot",
        type: "normal",
        click: this._ipcHandler.takeScreenshot.bind(this._ipcHandler),
      },
      {
        label: "Start Recording",
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
          this._isQuitting = true;
          app.quit();
        },
      },
    ]);

    this._tray.setContextMenu(ctxMenu);
    this._tray.setToolTip("screenmix");
    this._tray.on("click", this._mainWindow.show.bind(this._mainWindow));
  }
}

const screenmix: Screenmix = new Screenmix();

screenmix.init().catch((e) => {
  process.exit(1);
});
