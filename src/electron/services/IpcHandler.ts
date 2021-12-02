import { BrowserWindow, dialog } from "electron";
import { RendererProcessCtx } from "../types";
import { Store } from "./Store";

export class IpcHandler implements RendererProcessCtx {
  private _store: Store;

  constructor(store: Store) {
    this._store = store;
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
}
