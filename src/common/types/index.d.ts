declare global {
  interface Window {
    rendererProcessctrl: RendererProcessCtx;
  }
}

export type CaptureMode = "image" | "video";

export type ProcessNotification = "stopVideoCapture";

export type DashboardTab = "gallery" | "settings";

export type TopMenuEvent = "delete" | "selectToggle";

export type GalleryEvent = "selectModeOn" | "selectModeOff" | "itemSelected";

export interface EditState {
  previousImageIdx?: number;
  previousImageSrc: string;
}

export interface MediaFile {
  name: string;
  type: "video" | "image";
  path: string;
  customData?: { [key: string]: string | boolean | number };
}

export interface RendererProcessCtx {
  selectBaseDirectory(...args: any[]): Promise<string | undefined>;
  getDirectorySelection(...args: any[]): Promise<string>;
  getBaseDirectory(...args: any[]): Promise<string | undefined>;
  setBaseDirectory(dir: string): Promise<void>;
  getScreenmixDirectories(): Promise<string[]>;
  listMediaPaths(...args: any[]): Promise<MediaFile[]>;
  getDesktopSourceId(currentWindow?: boolean): Promise<string | undefined>;
  saveCapture(data: CaptureData): Promise<any>;
  saveChanges(data: UserDataStore): Promise<void>;
  getAllPreferences(): Promise<UserDataStore>;
  registerGlobalShortcuts(): Promise<void>;
  saveEditedImage(data: CaptureData): Promise<void>;
  deleteMediaFiles(files: string[]): Promise<void>;
  copyImageToClipboard(file: MediaFile): Promise<void>;
}

export type KeybindType =
  | "ssHotKey"
  | "scHotKey"
  | "ssHotKeyCurrentWindow"
  | "scHotKeyCurrentWindow";

export type UserDataField =
  | "baseDirectory"
  | "ssHotKey"
  | "ssHotKeyCurrentWindow"
  | "scHotKey"
  | "scHotKeyCurrentWindow"
  | "ssResolution"
  | "scResolution"
  | "screenmixDirectories";

export type UserDataStore = Partial<Record<UserDataField, any>>;

export interface CaptureData {
  dataUrl: string;
  mode: "image" | "video";
  name?: string;
}
