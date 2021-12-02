import path from "path";
import { BrowserWindow, dialog } from "electron";
import { RendererProcessCtx } from "../types";
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
    const dialogResponse = await dialog.showOpenDialog(window, {
      properties: ["openDirectory"],
    });

    if (dialogResponse.canceled) return undefined;

    const selectedDir: string = dialogResponse.filePaths[0];

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
}
