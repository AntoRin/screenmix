import { Component, OnInit } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { MediaFile, UserDataStore } from "../../../../../electron/types";
import { DashboardTab } from "../../../../types";
import { ProgressBarService } from "../../../shared/services/progress-bar.service";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
})
export class DashboardComponent implements OnInit {
  currentTab: DashboardTab = "gallery";
  PREFERENCES: UserDataStore = {};
  mediaFiles: MediaFile[] = [];

  constructor(
    private _sanitizer: DomSanitizer,
    private _progressBarService: ProgressBarService
  ) {}

  ngOnInit(): void {
    this.getRequiredData();
  }

  changeTab(tab: DashboardTab) {
    this.currentTab = tab;
  }

  async getRequiredData() {
    try {
      this._progressBarService.toggleOn();
      await this.getAllPreferences();
      await this.getGallery();
      this._progressBarService.toggleOff();
    } catch (error) {}
  }

  async getAllPreferences() {
    try {
      this.PREFERENCES = await window.rendererProcessctrl.getAllPreferences();
    } catch (error) {}
  }

  async getGallery() {
    try {
      const paths = await window.rendererProcessctrl.listScreenshotPaths(
        this.PREFERENCES.baseDirectory
      );
      this.mediaFiles = paths.map((f: MediaFile) => ({
        ...f,
        path: this._sanitizer.bypassSecurityTrustResourceUrl(f.path) as string,
      }));
    } catch (error) {}
  }
}
