import path from "path";
import { IpcApi, IpcChannel } from "common-types";

export const CHANNELS: IpcChannel[] = (
   [
      "addMediaDirectory",
      "copyImageToClipboard",
      "deleteMediaFiles",
      "getAllPreferences",
      "getBaseDirectory",
      "getDesktopSourceId",
      "getDirectorySelection",
      "getMediaDirectories",
      "listMediaPaths",
      "registerGlobalShortcuts",
      "removeMediaDirectory",
      "saveCapture",
      "saveChanges",
      "saveEditedImage",
      "setBaseDirectory",
      "handleVideoCaptureStatusChange",
      "exitApplication",
      "openBaseDirectory",
      "getAvailableScreens",
      "getAppMetaData",
   ] as IpcApi[]
).map((val) => `ipc:${val}`) as IpcChannel[];

export const PATHS = {
   icons: {
      jpeg: path.join(__dirname, "./assets", "logo", "logo_jpeg.jpeg"),
   },
   targetHtml: path.join(__dirname, "../ui/index.html"),
   preload: path.join(__dirname, "preload"),
};

export const generalConfig = {
   updateServerUrl: "https://update.electronjs.org/AntoRin/screenmix/win32",
   releaseNotesBaseUrl: "https://github.com/AntoRin/screenmix/releases/tag",
   licenseUrl: "https://github.com/AntoRin/screenmix/blob/master/LICENSE",
};
