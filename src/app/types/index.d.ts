export type CaptureMode = "image" | "video";

export type ProcessNotification = "stopVideoCapture";

export type DashboardTab = "gallery" | "settings";

export type TopMenuEvent = "delete" | "select";

export interface EditState {
  previousImageIdx?: number;
  previousImageSrc: string;
}
