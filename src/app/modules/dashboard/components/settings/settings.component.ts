import { OnDestroy } from "@angular/core";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { ConfirmationService, MessageService } from "primeng/api";
import { UserDataStore, UserDataField } from "../../../../../electron/types";
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

  constructor(
    private _confirmationServ: ConfirmationService,
    private _messageServ: MessageService
  ) {
    // For passing method reference
    this.handleNewKeybind = this.handleNewKeybind.bind(this);
  }

  ngOnInit(): void {
    this.configSettings = JSON.parse(JSON.stringify(this.PREFERENCES));
  }

  async updateDirectory() {
    try {
      const newDirectory =
        await window.rendererProcessctrl.getDirectorySelection();

      if (newDirectory) this.configSettings.baseDirectory = newDirectory;
    } catch (error) {
      this._messageServ.add({
        severity: "error",
        detail: "There was an error updating directory",
      });
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
      !modifierUsed || pressedKeys.length <= 1
        ? `Required two keys with at least 1 modifier.`
        : null;
  }

  removeListenerAndUpdateKeybind(captureType: "ss" | "sc") {
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

  private _settingsUpdated(): boolean {
    for (const prop of Object.getOwnPropertyNames(this.PREFERENCES)) {
      if (
        this.PREFERENCES[prop as UserDataField] !==
        this.configSettings[prop as UserDataField]
      ) {
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
