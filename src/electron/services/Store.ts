import path from "path";
import { writeFile, readFile } from "fs";
import { app } from "electron";
import { UserDataFields, UserDataStore } from "../types";

export class Store {
  private _userDataPath: string;

  constructor() {
    this._userDataPath = path.join(
      app.getPath("userData"),
      "userPreferences.json"
    );
  }

  async write(data: UserDataStore): Promise<void> {
    try {
      await new Promise<any>((resolve, reject) => {
        readFile(this._userDataPath, { encoding: "utf-8" }, (e, d) => {
          if (e) {
            if (e.code === "ENOENT") d = "{}";
            else return reject(e);
          }

          let json: any = {};

          try {
            json = JSON.parse(d);
          } catch (error) {}

          json = { ...json, ...data };

          writeFile(this._userDataPath, JSON.stringify(json, null, 3), () =>
            resolve({})
          );
        });
      });
    } catch (error) {
      throw error;
    }
  }

  async read(key: UserDataFields) {
    try {
      return (
        (await new Promise<UserDataStore>((resolve, reject) => {
          readFile(this._userDataPath, { encoding: "utf-8" }, (e, d) => {
            if (e) {
              if (e.code === "ENOENT") d = "{}";
              else return reject(e);
            }
            let parsedData = {};
            try {
              parsedData = JSON.parse(d);
            } catch (error) {}
            resolve(parsedData);
          });
        })) as any
      )[key];
    } catch (error) {
      throw error;
    }
  }
}
