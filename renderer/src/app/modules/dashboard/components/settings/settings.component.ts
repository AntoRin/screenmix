import { OnDestroy } from "@angular/core";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { ConfirmationService, MessageService } from "primeng/api";
import { UserDataStore, UserDataField, KeybindType, DashboardTab } from "common-types";
import { ErrorHandlerService } from "../../../shared/services/error-handler.service";

@Component({
   selector: "app-settings",
   templateUrl: "./settings.component.html",
   styleUrls: ["./settings.component.css"],
})
export class SettingsComponent implements OnInit, OnDestroy {
   @Input() public PREFERENCES: UserDataStore = {};

   @Output() public tabChangeEvent: EventEmitter<DashboardTab> = new EventEmitter<DashboardTab>();

   public configSettings: UserDataStore = {};

   public recordedKeybind: string = "";

   public availableScreenResolutions: string[] = [
      "1920x1080",
      "1600x900",
      "1366x768",
      "1280x720",
      "1152x648",
      "1024x576",
      "800x600",
   ];

   public keybindSelectionActive: KeybindType | null = null;
   public keybindError: string | null = null;

   constructor(
      private _confirmationServ: ConfirmationService,
      private _messageServ: MessageService,
      private _errorHandlerService: ErrorHandlerService
   ) {
      // For passing method reference
      this.handleNewKeybind = this.handleNewKeybind.bind(this);
   }

   ngOnInit(): void {
      try {
         this.configSettings = JSON.parse(JSON.stringify(this.PREFERENCES));
      } catch (error) {
         this._errorHandlerService.handleError(error);
      }
   }

   listenForKeybinds() {
      window.addEventListener("keydown", this.handleNewKeybind);
   }

   handleNewKeybind(ev: KeyboardEvent) {
      const pressedKeys: string[] = [];

      const modifierKeyMap: any = {
         altKey: "Alt",
         metaKey: "Meta",
         shiftKey: "Shift",
         ctrlKey: "Control",
      };

      Object.getOwnPropertyNames(modifierKeyMap).forEach((modifier: string) => {
         if ((ev as any)[modifier]) {
            pressedKeys.push(modifierKeyMap[modifier]);
         }
      });

      if (!pressedKeys.includes(ev.key)) pressedKeys.push(ev.key);

      this.recordedKeybind = pressedKeys.join("+");

      const modifierUsed = pressedKeys.find((key) => {
         for (const modifier of Object.getOwnPropertyNames(modifierKeyMap)) {
            if (modifierKeyMap[modifier] === key) {
               return true;
            }
         }
         return false;
      });

      this.keybindError =
         !modifierUsed || pressedKeys.length <= 1 ? `Required two keys with at least 1 modifier.` : null;
   }

   removeListenerAndUpdateKeybind(captureType: KeybindType) {
      window.removeEventListener("keydown", this.handleNewKeybind);

      if (this.keybindError) {
         this._messageServ.add({
            severity: "error",
            detail: this.keybindError,
         });
         this.recordedKeybind = "";
         this.keybindError = null;
         return;
      }

      if (!this.recordedKeybind) return;

      switch (captureType) {
         case "ssHotKey":
            this.configSettings.ssHotKey = this.recordedKeybind;
            break;
         case "scHotKey":
            this.configSettings.scHotKey = this.recordedKeybind;
            break;
         case "ssHotKeyCurrentWindow":
            this.configSettings.ssHotKeyCurrentWindow = this.recordedKeybind;
            break;
         case "scHotKeyCurrentWindow":
            this.configSettings.scHotKeyCurrentWindow = this.recordedKeybind;
            break;
      }

      this.recordedKeybind = "";
   }

   async saveSettings() {
      try {
         await window.rendererProcessCtrl.invoke("ipc:saveChanges", this.configSettings);
         await window.rendererProcessCtrl.invoke("ipc:registerGlobalShortcuts");

         this._messageServ.add({
            severity: "success",
            detail: "Settings updated successfully",
         });
         this.tabChangeEvent.emit("gallery");
      } catch (error) {
         this._errorHandlerService.handleError(error, {
            header: "There was an error updating your settings",
         });
      }
   }

   private _settingsUpdated(): boolean {
      for (const prop of Object.getOwnPropertyNames(this.PREFERENCES)) {
         if (prop === "mediaDirectories") continue;

         if (this.PREFERENCES[prop as UserDataField] !== this.configSettings[prop as UserDataField]) {
            return true;
         }
      }
      return false;
   }

   cancelSettings() {
      if (this._settingsUpdated()) {
         this._confirmationServ.confirm({
            header: "Your changes will be discarded",
            message: `Are you sure you want to discard your settings?`,
            accept: () => {
               this.tabChangeEvent.emit("gallery");
            },
         });
      } else {
         this.tabChangeEvent.emit("gallery");
      }
   }

   ngOnDestroy(): void {
      window.removeEventListener("keydown", this.handleNewKeybind);
   }
}
