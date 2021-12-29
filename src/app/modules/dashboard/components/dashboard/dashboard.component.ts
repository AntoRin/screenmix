import { Component, HostListener, OnInit } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { MediaFile, UserDataStore } from "../../../../../electron/types";
import { DashboardTab } from "../../../../types";
import { ProgressBarService } from "../../../shared/services/progress-bar.service";
import { MediaStreamService } from "../../services/media-stream.service";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
})
export class DashboardComponent implements OnInit {
  currentTab: DashboardTab = "gallery";
  PREFERENCES: UserDataStore = {};
  mediaFiles: MediaFile[] = [];

  showVideoCaptureMarker: boolean = false;

  constructor(
    private _sanitizer: DomSanitizer,
    private _mediaStreamService: MediaStreamService,
    private _progressBarService: ProgressBarService
  ) {}

  ngOnInit(): void {
    this.getRequiredData();
    this._mediaStreamService.streamNotifications$
      .asObservable()
      .subscribe((notification) => {
        if (notification === "videoCaptureStart") {
          this.showVideoCaptureMarker = true;
        } else if (notification === "videoCaptureEnd") {
          this.showVideoCaptureMarker = false;
        }
      });
  }

  @HostListener("window:message", ["$event"])
  handleScreenEvents(event: MessageEvent) {
    switch (event.data) {
      case "fromMain:takeScreenshot":
        return this._mediaStreamService.captureScreen(
          "image",
          this.PREFERENCES.ssResolution
        );

      case "fromMain:captureScreen":
        return this._mediaStreamService.captureScreen(
          "video",
          this.PREFERENCES.scResolution
        );

      case "fromMain:NewItemInGallery":
        console.log("newItem");
        return this.getGallery();

      default:
        return;
    }
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
      this._progressBarService.toggleOn();
      this.PREFERENCES = await window.rendererProcessctrl.getAllPreferences();
    } catch (error) {
    } finally {
      this._progressBarService.toggleOff();
    }
  }

  async getGallery() {
    try {
      this._progressBarService.toggleOn();
      const paths = await window.rendererProcessctrl.listMediaPaths(
        this.PREFERENCES.baseDirectory
      );
      this.mediaFiles = paths.map((f: MediaFile) => ({
        ...f,
        path: this._sanitizer.bypassSecurityTrustResourceUrl(f.path) as string,
      }));
    } catch (error) {
    } finally {
      this._progressBarService.toggleOff();
    }
  }
}
