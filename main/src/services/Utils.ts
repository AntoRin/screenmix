import { CustomError } from "../../../common/types";

export class Utils {
   constructor() {}

   static serializeError(error: CustomError) {
      return {
         code: error?.["code"] || "",
         name: error?.name || "",
         message: error?.message || "",
      };
   }
}
