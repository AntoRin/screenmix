export type CaptureMode = "image" | "video";

export type ProcessNotification = "stopVideoCapture";

export type DashboardTab = "gallery" | "settings";

export type TopMenuEvent = "delete" | "selectToggle";

export type GalleryEvent = "selectModeOn" | "selectModeOff" | "itemSelected";

export interface EditState {
  previousImageIdx?: number;
  previousImageSrc: string;
}
