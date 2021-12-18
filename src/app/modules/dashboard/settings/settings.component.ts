import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { UserDataStore } from "../../../../electron/types";
import { DashboardTab } from "../../../types";

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

  constructor() {}

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

  saveSettings() {
    window.rendererProcessctrl
      .saveChanges(this.configSettings)
      .then(() => {
        this.settingsUpdateEvent.emit();
      })
      .catch((e) => {});
  }

  cancelSettings() {
    this.tabChangeEvent.emit("gallery");
  }
}
