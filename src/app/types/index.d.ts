export type CaptureMode = "image" | "video";

export type ProcessNotification = "stopVideoCapture";

export type DashboardTab = "gallery" | "settings";

export interface EditState {
  previousImageIdx?: number;
  previousImageSrc: string;
}
