import { OnDestroy } from "@angular/core";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { MessageService } from "primeng/api";
import { UserDataStore } from "../../../../../electron/types";
import { DashboardTab } from "../../../../types";

@Component({
  selector: "app-settings",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.css"],
})
export class SettingsComponent implements OnInit, OnDestroy {
  @Input() public PREFERENCES: UserDataStore = {};

  @Output() public settingsUpdateEvent: EventEmitter<void> =
    new EventEmitter<void>();
  @Output() public tabChangeEvent: EventEmitter<DashboardTab> =
    new EventEmitter<DashboardTab>();

  public configSettings: UserDataStore = {};

  public recordedKeybind: string = "";

  public availableScreenResolutions: string[] = [
    "1920x1080",
    "1600×900",
    "1366×768",
    "1280×720",
    "1152×648",
    "1024×576",
    "800x600",
  ];

  public keybindSelectionActive: "ss" | "sc" | null = null;
  public keybindError: string | null = null;

  constructor(private _messageServ: MessageService) {}

  ngOnInit(): void {
    this.configSettings = JSON.parse(JSON.stringify(this.PREFERENCES));
  }

  updateDirectory() {
    window.rendererProcessctrl
      .getDirectorySelection()
      .then((value) => {
        if (value) this.configSettings.baseDirectory = value;
      })
      .catch((e) => {});
  }

  listenForKeybinds() {
    window.addEventListener("keydown", this.handleNewKeybind.bind(this));
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

    if (!modifierUsed) {
      this.keybindError = `Required at least 1 modifier.`;
    } else {
      this.keybindError = null;
    }
  }

  removeListenerAndUpdateKeybind(captureType: "ss" | "sc") {
    if (this.keybindError) {
      this._messageServ.add({
        severity: "error",
        detail: "There should be at least 1 modifier",
      });
      return;
    }

    window.removeAllListeners!("keydown");

    if (!this.recordedKeybind) return;

    if (captureType === "ss") {
      this.configSettings.ssHotKey = this.recordedKeybind;
    } else if (captureType === "sc") {
      this.configSettings.scHotKey = this.recordedKeybind;
    }

    this.recordedKeybind = "";
  }

  async saveSettings() {
    try {
      await window.rendererProcessctrl.saveChanges(this.configSettings);
      await window.rendererProcessctrl.registerGlobalShortcuts();
      this.settingsUpdateEvent.emit();
      this._messageServ.add({
        severity: "success",
        detail: "Settings updated successfully",
      });
    } catch (error) {
      this._messageServ.add({
        severity: "error",
        detail: "There was an error updating your settings",
      });
    }
  }

  cancelSettings() {
    this.tabChangeEvent.emit("gallery");
  }

  ngOnDestroy(): void {
    window.removeAllListeners!("keydown");
  }
}
