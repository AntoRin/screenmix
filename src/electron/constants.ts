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
  ] as IpcApi[]
).map((val) => `ipc:${val}`) as IpcChannel[];
