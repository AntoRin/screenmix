import path from "path";
import { BrowserWindow, dialog, desktopCapturer } from "electron";
import { CaptureData, RendererProcessCtx } from "../types";
import { Store } from "./Store";
import { Dirent, promises as fsp } from "fs";

export class IpcHandler implements RendererProcessCtx {
  private _store: Store;
  private _imageExtensions: string[];

  constructor(store: Store) {
    this._store = store;
    this._imageExtensions = [".jpg", ".png"];
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

      return files;
    } catch (error) {
      throw error;
    }
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
