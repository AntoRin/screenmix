import path from "path";
import { fileURLToPath } from "url";
import {
  BrowserWindow,
  dialog,
  desktopCapturer,
  globalShortcut,
  ipcMain,
  nativeImage,
  clipboard,
} from "electron";
import {
  CaptureData,
  MediaFile,
  RendererProcessCtx,
  UserDataStore,
} from "../../common/types";
import { Store } from "./Store";
import { Dirent, promises as fsp, statSync } from "fs";

export class IpcHandler implements RendererProcessCtx {
  private _store: Store;
  private _mainWindow: BrowserWindow | undefined;
  private _imageExtensions: string[];
  private _videoExtensions: string[];

  constructor() {
    this._store = new Store();
    this._imageExtensions = [".jpg", ".png"];
    this._videoExtensions = [".mp4"];
  }

  public initializeIpcListeners(mainWindow?: BrowserWindow) {
    if (!mainWindow) throw new Error("NO_WINDOW");

    this._mainWindow = mainWindow;

    ipcMain.handle("ipc:selectBaseDirectory", () =>
      this.selectBaseDirectory(mainWindow)
    );

    ipcMain.handle("ipc:getBaseDirectory", this.getBaseDirectory.bind(this));

    ipcMain.handle("ipc:listMediaPaths", (_, baseDir: string | undefined) =>
      this.listMediaPaths(baseDir)
    );

    ipcMain.handle(
      "ipc:getDesktopSourceId",
      this.getDesktopSourceId.bind(this)
    );

    ipcMain.handle("ipc:saveCapturedScreenshot", (_, data: CaptureData) =>
      this.saveCapture(data)
    );

    ipcMain.handle("ipc:getAllPreferences", this.getAllPreferences.bind(this));

    ipcMain.handle(
      "ipc:getDirectorySelection",
      this.getDirectorySelection.bind(this, mainWindow)
    );

    ipcMain.handle("ipc:saveChanges", (_, data) => this.saveChanges(data));

    ipcMain.handle("ipc:registerGlobalShortcuts", () =>
      this.registerGlobalShortcuts(mainWindow)
    );

    ipcMain.handle("ipc:saveEditedImage", (_, data) =>
      this.saveEditedImage(data)
    );

    ipcMain.handle("ipc:deleteMediaFiles", (_, files: string[]) =>
      this.deleteMediaFiles(files)
    );

    ipcMain.handle("ipc:copyImageToClipboard", (_, file: MediaFile) =>
      this.copyImageToClipboard(file)
    );
  }

  async registerGlobalShortcuts(window?: BrowserWindow) {
    try {
      if (!window) throw new Error("NO_WINDOW");

      this.unregisterGlobalShortcuts();

      const ssHotKey: string = await this._store.read("ssHotKey");
      const scHotKey: string = await this._store.read("scHotKey");

      globalShortcut.registerAll([ssHotKey], () => {
        this.takeScreenshot(window);
      });
      globalShortcut.registerAll([scHotKey], () => {
        this.captureScreen(window);
      });
    } catch (error) {
      throw error;
    }
  }

  unregisterGlobalShortcuts() {
    globalShortcut.unregisterAll();
  }

  async getDirectorySelection(window: BrowserWindow) {
    return (await this._selectDirectories(window))[0];
  }

  async selectBaseDirectory(window: BrowserWindow) {
    const [selectedDir] = await this._selectDirectories(window);

    await this._store.write({
      baseDirectory: selectedDir,
    });

    return selectedDir;
  }

  async getBaseDirectory() {
    try {
      return await this._store.read("baseDirectory");
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
        baseDirectory = await this._store.read("baseDirectory");
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
            (this._imageExtensions.includes(
              path.extname(fileData.name).toLowerCase()
            ) ||
              this._videoExtensions.includes(
                path.extname(fileData.name).toLowerCase()
              ))
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

      return files.map((f) => ({
        name: path.basename(f),
        path: path.join("file:///", f),
        type: this._imageExtensions.includes(path.extname(f).toLowerCase())
          ? "image"
          : "video",
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
    } catch (error) {}
  }

  public takeScreenshot(window: BrowserWindow) {
    window.webContents.send("fromMain:takeScreenshot");
  }

  public captureScreen(window: BrowserWindow) {
    window.webContents.send("fromMain:captureScreen");
  }

  private async _selectDirectories(window: BrowserWindow): Promise<string[]> {
    try {
      const dialogResponse = await dialog.showOpenDialog(window, {
        properties: ["openDirectory"],
      });

      if (dialogResponse.canceled) return [];

      return dialogResponse.filePaths;
    } catch (error) {
      throw error;
    }
  }

  async getDesktopSourceId() {
    try {
      const sources = await desktopCapturer.getSources({
        types: ["window", "screen"],
      });

      const requiredSource = sources.find((s) => s.name === "Entire Screen");

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

      const baseDir = await this._store.read("baseDirectory");

      const fileName =
        captureData.mode === "image"
          ? captureData.name || String(Date.now()) + ".png"
          : captureData.name || String(Date.now()) + ".mp4";

      await fsp.writeFile(path.join(baseDir, fileName), base64Data, {
        encoding: "base64",
      });

      if (notify) this._notifyRenderer("fromMain:refreshGallery");
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
}
