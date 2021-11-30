import { ipcRenderer, contextBridge } from "electron";

function sendSynchronousMessage(channel: string, ...args: any[]): any {
  return ipcRenderer.sendSync(channel, args);
}

contextBridge.exposeInMainWorld(
  "sendSynchronousMessage",
  sendSynchronousMessage
);
