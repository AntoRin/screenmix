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
  listMediaPaths(...args: any[]): Promise<MediaFile[]>;
  getDesktopSourceId(...args: any[]): Promise<string | undefined>;
  saveCapture(data: CaptureData): Promise<any>;
  saveChanges(data: UserDataStore): Promise<void>;
  getAllPreferences(): Promise<UserDataStore>;
  registerGlobalShortcuts(): Promise<void>;
  saveEditedImage(data: CaptureData): Promise<void>;
  deleteMediaFiles(files: string[]): Promise<void>;
}

export type UserDataField =
  | "baseDirectory"
  | "ssHotKey"
  | "scHotKey"
  | "ssResolution"
  | "scResolution";

export type UserDataStore = Partial<Record<UserDataField, any>>;

export interface CaptureData {
  dataUrl: string;
  mode: "image" | "video";
  name?: string;
}
