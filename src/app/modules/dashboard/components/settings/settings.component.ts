import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { UserDataStore } from "../../../../../electron/types";
import { DashboardTab } from "../../../../types";

@Component({
  selector: "app-settings",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.css"],
})
export class SettingsComponent implements OnInit {
  @Input() PREFERENCES: UserDataStore = {};
  @Output() settingsUpdateEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() tabChangeEvent: EventEmitter<DashboardTab> =
    new EventEmitter<DashboardTab>();

  configSettings: UserDataStore = {};

  recordedKeybind: string = "";

  availableScreenResolutions: string[] = [
    "1920x1080",
    "1600×900",
    "1366×768",
    "1280×720",
    "1152×648",
    "1024×576",
    "800x600",
  ];

  constructor() {}

  keybindSelectionActive: "ss" | "sc" | null = null;

  ngOnInit(): void {
    this.configSettings = JSON.parse(JSON.stringify(this.PREFERENCES));
    console.log(this.configSettings);
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
    console.log(ev);
    const modifiers: string[] = [];

    const keyMap: any = {
      altKey: "Alt",
      metaKey: "Meta",
      shiftKey: "Shift",
      ctrlKey: "Control",
    };

    Object.getOwnPropertyNames(keyMap).forEach((modifier: string) => {
      if ((ev as any)[modifier]) {
        modifiers.push(keyMap[modifier]);
      }
    });

    if (!modifiers.includes(ev.key)) modifiers.push(ev.key);

    this.recordedKeybind = modifiers.join("+");
  }

  removeListenerAndUpdateKeybind(captureType: "ss" | "sc") {
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
    } catch (error) {}
  }

  cancelSettings() {
    this.tabChangeEvent.emit("gallery");
  }
}
