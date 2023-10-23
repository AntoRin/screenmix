import { ErrorHandler, Injectable, NgZone } from "@angular/core";
import logger from "electron-log/renderer";
import { Confirmation, ConfirmationService } from "primeng/api";

@Injectable({
   providedIn: "root",
})
export class ErrorHandlerService implements ErrorHandler {
   constructor(private _confirmationService: ConfirmationService, private _zone: NgZone) {}

   handleError(error: any, confirmationOptions?: Confirmation) {
      this._zone.run(() => {
         // Actions that cause UI changes must be called within the NgZone.run method, so that the code will be run inside the Angular change-detection zone. Async errors caught by angular using the ErrorHandler are run outside of the zone. So, doing this to re-enter back into the zone.

         this._confirmationService.confirm({
            acceptLabel: confirmationOptions?.acceptLabel || "Okay",
            rejectVisible: confirmationOptions?.rejectVisible || false,
            closeOnEscape: confirmationOptions?.closeOnEscape || false,
            blockScroll: confirmationOptions?.blockScroll || true,
            defaultFocus: confirmationOptions?.defaultFocus || "accept",
            header: confirmationOptions?.header || "An Error Occured",
            message: error?.message || confirmationOptions?.message || "An unknown error occured",
            dismissableMask: confirmationOptions?.dismissableMask || false,
         });
      });

      logger.error(error);
   }
}
