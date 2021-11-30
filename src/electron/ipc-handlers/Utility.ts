import { ipcMain } from "electron";

ipcMain.on("resolvePath", (event, arg) => {
  console.log(arg);
  event.returnValue = "hello there";
});
