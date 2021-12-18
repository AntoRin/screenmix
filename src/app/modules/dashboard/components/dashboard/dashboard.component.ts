import { Component, OnInit } from "@angular/core";
import { UserDataStore } from "../../../../../electron/types";
import { DashboardTab } from "../../../../types";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
})
export class DashboardComponent implements OnInit {
  currentTab: DashboardTab = "gallery";
  baseDirectory: string | undefined;
  PREFERENCES: UserDataStore = {};

  constructor() {}

  ngOnInit(): void {
    this.getBaseDirectory();
    this.getAllPreferences();
  }

  getAllPreferences() {
    window.rendererProcessctrl
      .getAllPreferences()
      .then((data) => {
        this.PREFERENCES = data;
      })
      .catch((e) => {});
  }

  getBaseDirectory() {
    window.rendererProcessctrl
      .getBaseDirectory()
      .then((dir) => {
        if (dir) this.baseDirectory = dir;
      })
      .catch((e) => {});
  }

  changeTab(tab: DashboardTab) {
    this.currentTab = tab;
  }
}
