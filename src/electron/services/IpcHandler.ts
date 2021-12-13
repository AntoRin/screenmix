import path from "path";
import {
  BrowserWindow,
  dialog,
  desktopCapturer,
  globalShortcut,
  ipcMain,
} from "electron";
import { CaptureData, RendererProcessCtx } from "../types";
import { Store } from "./Store";
import { Dirent, promises as fsp, statSync } from "fs";

export class IpcHandler implements RendererProcessCtx {
  private _store: Store;
  private _imageExtensions: string[];

  constructor(store: Store) {
    this._store = store;
    this._imageExtensions = [".jpg", ".png"];
  }

  public initializeIpcListeners(mainWindow?: BrowserWindow) {
    if (!mainWindow) throw new Error("NO_WINDOW");

    ipcMain.handle("ipc:selectBaseDirectory", () =>
      this.selectBaseDirectory(mainWindow)
    );

    ipcMain.handle("ipc:getBaseDirectory", this.getBaseDirectory.bind(this));

    ipcMain.handle(
      "ipc:getPreferenceSetStatus",
      this.getPreferencesSetStatus.bind(this)
    );

    ipcMain.handle(
      "ipc:listScreenshotPaths",
      (_, baseDir: string | undefined) => this.listScreenshotPaths(baseDir)
    );

    ipcMain.handle(
      "ipc:getDesktopSourceId",
      this.getDesktopSourceId.bind(this)
    );

    ipcMain.handle("ipc:saveCapturedScreenshot", (_, data: CaptureData) =>
      this.saveCapture(data)
    );

    ipcMain.handle("ipc:updateBaseDirectory", (_, newDir: string) =>
      this.updateBaseDirectory(newDir)
    );
  }

  async registerGlobalShortcuts(window?: BrowserWindow) {
    try {
      if (!window) throw new Error("NO_WINDOW");

      const ssKeyBinds: string[] = (await this._store.read("ssKeyBinds")) || [];
      const scKeyBinds: string[] = (await this._store.read("scKeyBinds")) || [];

      globalShortcut.registerAll(ssKeyBinds, () => {
        this.takeScreenshot(window);
      });
      globalShortcut.registerAll(scKeyBinds, () => {
        this.captureScreen(window);
      });
    } catch (error) {
      throw error;
    }
  }

  unregisterGlobalShortcuts() {
    globalShortcut.unregisterAll();
  }

  async selectBaseDirectory(window: BrowserWindow) {
    const [selectedDir] = await this._selectDirectories(window);

    await this._store.write({
      baseDirectory: selectedDir,
      preferencesSetStatus: true,
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

  async updateBaseDirectory(newDir: string) {
    try {
      console.log(newDir);
      return await this._store.write({ baseDirectory: newDir });
    } catch (error) {
      throw error;
    }
  }

  async getPreferencesSetStatus() {
    try {
      return (await this._store.read("preferencesSetStatus")) || false;
    } catch (error) {
      throw error;
    }
  }

  async listScreenshotPaths(baseDirectory?: string): Promise<string[]> {
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
            this._imageExtensions.includes(
              path.extname(fileData.name).toLowerCase()
            )
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

      return files;
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

  async saveCapture(captureData: CaptureData) {
    try {
      const base64Data = captureData.dataUrl.split(";base64,")[1];

      const baseDir = await this._store.read("baseDirectory");

      const fileName =
        captureData.mode === "image"
          ? String(Date.now()) + ".png"
          : String(Date.now()) + ".mp4";

      await fsp.writeFile(path.join(baseDir, fileName), base64Data, {
        encoding: "base64",
      });
    } catch (error) {
      console.log(error);
    }
  }
}
