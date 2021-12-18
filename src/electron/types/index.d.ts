declare global {
  interface Window {
    rendererProcessctrl: RendererProcessCtx;
  }
}

export interface RendererProcessCtx {
  selectBaseDirectory(...args: any[]): Promise<string | undefined>;
  getDirectorySelection(...args: any[]): Promise<string>;
  getBaseDirectory(...args: any[]): Promise<string | undefined>;
  listScreenshotPaths(...args: any[]): Promise<string[]>;
  getDesktopSourceId(...args: any[]): Promise<string | undefined>;
  saveCapture(data: CaptureData): Promise<any>;
  saveChanges(data: UserDataStore): Promise<void>;
  getAllPreferences(): Promise<UserDataStore>;
}

export type UserDataFields = "baseDirectory" | "ssKeyBinds" | "scKeyBinds";

export type UserDataStore = Partial<Record<UserDataFields, any>>;

export interface CaptureData {
  dataUrl: string;
  mode: "image" | "video";
}
