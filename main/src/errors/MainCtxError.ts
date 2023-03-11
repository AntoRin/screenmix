import { MainCtxErrorCode } from "./error-codes";

export class MainCtxError extends Error {
   public code: MainCtxErrorCode;

   constructor(message: string, code: MainCtxErrorCode) {
      super(message);
      this.code = code;
      this.name = Object.getPrototypeOf(this).constructor.name;
   }
}
