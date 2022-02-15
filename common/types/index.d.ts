declare global {
   interface Window {
      rendererProcessCtrl: RendererExposedApi;
   }
}

export interface RendererExposedApi {
   invoke(channel: IpcChannel, data?: any): Promise<any> | undefined;
}

export type CaptureMode = "image" | "video";

export type ProcessNotification = "stopVideoCapture";

export type DashboardTab = "gallery" | "settings";

export type TopMenuEvent = "delete" | "selectToggle";

export type GalleryEvent = "selectModeOn" | "selectModeOff" | "itemSelected";

export type VideoCaptureStatus = "videoCaptureStart" | "videoCaptureEnd";

export type ImageViewerEventType =
   | "nextImage"
   | "previousImage"
   | "save"
   | "closeViewer"
   | "closeEditor"
   | "openEditor";

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
}

export type IpcApi = Required<keyof RendererProcessCtx>;

export type IpcChannel = `ipc:${IpcApi}`;

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
   | "mediaDirectories";

export type UserDataStore = Partial<Record<UserDataField, any>>;

export interface CaptureData {
   dataUrl: string;
   mode: "image" | "video";
   name?: string;
}

export type MainProcessInternalEvent =
   | "videoCaptureStatusChange"
   | "exitApplication";
