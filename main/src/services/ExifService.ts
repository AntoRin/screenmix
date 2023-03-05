import path from "path";
import { ExifTool } from "exiftool-vendored";

export class ExifService {
   private static _instance: ExifService | undefined;
   private _exifTool: ExifTool;

   private constructor() {
      this._exifTool = new ExifTool({
         exiftoolEnv: {
            EXIFTOOL_HOME: path.join(__dirname, "../ExifTool_config"),
         },
      });
   }

   static get Instance() {
      if (!ExifService._instance) {
         ExifService._instance = new ExifService();
      }
      return ExifService._instance;
   }

   async parse(path: string) {
      try {
         const tags = await this._exifTool.read(path);
         return JSON.parse(tags.Comment || "{}");
      } catch (error) {
         return {};
      }
   }

   async write(path: string, content: string) {
      try {
         await this._exifTool.write(path, {
            Comment: content,
         });
      } catch (error) {
         throw error;
      }
   }

   exit() {
      this._exifTool.end();
   }
}
