import path from "path";
import { IpcApi, IpcChannel } from "../common/types";

export const Channels: IpcChannel[] = (
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
  ] as IpcApi[]
).map((val) => `ipc:${val}`) as IpcChannel[];

export const PreloadScriptPath = path.join(__dirname, "../index.html");

export const Paths = {
  icons: {
    jpeg: path.join(__dirname, "../assets", "logo", "logo_jpeg.jpeg"),
  },
  targetHtml: path.join(__dirname, "../index.html"),
  preload: path.join(__dirname, "preload"),
};
