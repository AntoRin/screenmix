import path from "path";
import { readFileSync, promises as fsp } from "fs";
import { app } from "electron";
import { UserDataField, UserDataStore } from "../types";

export class Store {
   private _userDataPath: string;
   private _userData: UserDataStore;

   constructor() {
      this._userDataPath = path.join(app.getPath("userData"), "userPreferences.json");

      try {
         this._userData = {
            ...this.defaults,
            ...JSON.parse(readFileSync(this._userDataPath, { encoding: "utf-8" })),
         };
      } catch (e: any) {
         if (e.name === "SyntaxError" || e.code === "ENOENT") this._userData = this.defaults;
         else throw e;
      }
   }

   private get defaults(): UserDataStore {
      return {
         baseDirectory: null,
         mediaDirectories: [],
         scHotKey: "Alt+Home",
         scHotKeyCurrentWindow: "Alt+Delete",
         ssHotKey: "Alt+Insert",
         ssHotKeyCurrentWindow: "Alt+End",
         ssResolution: "800x600",
         scResolution: "800x600",
      };
   }

   private async backupData() {
      try {
         await fsp.writeFile(this._userDataPath, JSON.stringify(this._userData, null, 3), { encoding: "utf-8" });
      } catch (error) {}
   }

   async write(data: UserDataStore): Promise<void> {
      try {
         this._userData = { ...this._userData, ...data };
         await this.backupData();
      } catch (error) {
         throw error;
      }
   }

   read(key: UserDataField | undefined): any {
      return key ? this._userData[key] : this._userData;
   }
}
