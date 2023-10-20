declare global {
   interface Window {
      rendererProcessCtrl: RendererExposedApi;
   }
}

export interface RendererExposedApi {
   invoke<T>(channel: IpcChannel, data?: any): Promise<T>;
}

export type CaptureMode = "image" | "video";

export type ProcessNotification = "stopVideoCapture";

export type DashboardTab = "gallery" | "settings" | "workspaces";

export type TopMenuEvent = "delete" | "selectToggle";

export type GalleryEvent = "selectModeOn" | "selectModeOff" | "itemSelected";

export type VideoCaptureStatus = "videoCaptureStart" | "videoCaptureEnd";

export interface ComponentEvent {
   name: string;
   data?: any;
   callback?: (error?: any, data?: string) => void;
}

export interface MediaStreamEvent extends ComponentEvent {
   name: VideoCaptureStatus | "imagePreview" | "videoPreview" | "selectScreen";
   data?: string;
   callback?: (error?: any, data?: string) => void;
}

export interface GalleryAction extends ComponentEvent {
   name: "delete" | "imagePreview" | "videoPreview";
}

export type ImageViewerEventType =
   | "nextImage"
   | "previousImage"
   | "save"
   | "saveAsCopy"
   | "closeViewer"
   | "copyImage"
   | "closeEditor"
   | "openEditor"
   | "delete"
   | "acceptPreview"
   | "rejectPreview";

export interface ImageResolution {
   width: number;
   height: number;
}

export interface ImageViewerEvent {
   eventName: ImageViewerEventType;
   data?: any;
}

export interface MediaFile {
   name: string;
   type: "video" | "image";
   path: string;
   createdAt: number;
   customData?: { [key: string]: string | boolean | number };
}

export interface RendererProcessCtx {
   addMediaDirectory(...args: any[]): Promise<string | undefined>;
   removeMediaDirectory(path: string): Promise<void>;
   getDirectorySelection(...args: any[]): Promise<string>;
   getBaseDirectory(...args: any[]): string | undefined;
   setBaseDirectory(dir: string): Promise<void>;
   getMediaDirectories(): string[];
   listMediaPaths(...args: any[]): Promise<MediaFile[]>;
   getDesktopSourceId(currentWindow?: boolean): Promise<string | undefined>;
   saveCapture(data: CaptureData): Promise<any>;
   saveChanges(data: UserDataStore): Promise<void>;
   getAllPreferences(): Promise<UserDataStore>;
   registerGlobalShortcuts(): void | Promise<void>;
   saveEditedImage(data: CaptureData): Promise<void>;
   deleteMediaFiles(files: string[]): Promise<void>;
   copyImageToClipboard(file: MediaFile): Promise<void>;
   handleVideoCaptureStatusChange(status: VideoCaptureStatus): Promise<void>;
   exitApplication(): void;
   openBaseDirectory(): Promise<void>;
   getAvailableScreens(): Promise<ScreenData[]>;
   getAppMetaData(): AppMetaData;
}

export type IpcApi = Required<keyof RendererProcessCtx>;

export type IpcChannel = `ipc:${IpcApi}`;

export type KeybindType = "ssHotKey" | "scHotKey" | "ssHotKeyCurrentWindow" | "scHotKeyCurrentWindow";

export type UserDataField =
   | "baseDirectory"
   | "ssHotKey"
   | "ssHotKeyCurrentWindow"
   | "scHotKey"
   | "scHotKeyCurrentWindow"
   | "ssResolution"
   | "scResolution"
   | "mediaDirectories";

export type UserDataStore = Partial<Record<UserDataField, any>>;

export interface CaptureData {
   dataUrl: string;
   mode: "image" | "video";
   name?: string;
}

export type MainProcessInternalEvent = "videoCaptureStatusChange" | "exitApplication" | "hideMainWindow" | "showMainWindow";

export interface ScreenData {
   name: string;
   id: string;
   thumbnail: string;
}

export type MainToRendererEvent =
   | "fromMain:takeScreenshot"
   | "fromMain:captureScreen"
   | "fromMain:refreshGallery"
   | "fromMain:newImage"
   | "fromMain:newVideo"
   | "fromMain:takeScreenshotOfCurrentWindow"
   | "fromMain:captureCurrentScreen"
   | "fromMain:preferencesUpdated";

export interface CustomError extends Error {
   [key: string]: any;
}

export interface AppMetaData {
   appVersion: string;
   releaseNotesUrl: string;
   licenseUrl: string;
   lastCheckedForUpdateAt: number;
   icon: string;
}
