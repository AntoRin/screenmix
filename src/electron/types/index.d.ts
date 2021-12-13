declare global {
  interface Window {
    rendererProcessctrl: RendererProcessCtx;
  }
}

export interface RendererProcessCtx {
  selectBaseDirectory(...args: any[]): Promise<string | undefined>;
  getBaseDirectory(...args: any[]): Promise<string | undefined>;
  getPreferencesSetStatus(...args: any[]): Promise<boolean>;
  listScreenshotPaths(...args: any[]): Promise<string[]>;
  getDesktopSourceId(...args: any[]): Promise<string | undefined>;
  saveCapture(data: CaptureData): Promise<any>;
  updateBaseDirectory(newDir: string): Promise<void>;
}

export type UserDataFields =
  | "baseDirectory"
  | "preferencesSetStatus"
  | "ssKeyBinds"
  | "scKeyBinds";

export type UserDataStore = Partial<Record<UserDataFields, any>>;

export interface CaptureData {
  dataUrl: string;
  mode: "image" | "video";
}
