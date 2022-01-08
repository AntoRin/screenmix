import { Component, HostListener, OnInit } from "@angular/core";
import { MenuItem } from "primeng/api";
import { Subject } from "rxjs";
import { MediaFile, UserDataStore } from "../../../../../electron/types";
import { DashboardTab, TopMenuEvent } from "../../../../types";
import { ProgressBarService } from "../../../shared/services/progress-bar.service";
import { MediaStreamService } from "../../services/media-stream.service";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
})
export class DashboardComponent implements OnInit {
  public currentTab: DashboardTab = "gallery";
  public PREFERENCES: UserDataStore = {};
  public mediaFiles: MediaFile[] = [];
  public showVideoCaptureMarker: boolean = false;
  public galleryActions$: Subject<string> = new Subject<string>();
  public gallerySelectMode: boolean = false;
  public totalSelectedItems: number = 0;

  public menuItems: MenuItem[] = [
    {
      label: "Home",
      icon: "pi pi-home",
      command: this.changeTab.bind(this, "gallery"),
    },
    {
      label: "File",
      icon: "pi pi-fw pi-file",
      items: [
        {
          label: "New",
          icon: "pi pi-fw pi-plus",
          items: [
            {
              label: "Bookmark",
              icon: "pi pi-fw pi-bookmark",
            },
            {
              label: "Video",
              icon: "pi pi-fw pi-video",
            },
          ],
        },
        {
          label: "Select",
          icon: "pi pi-paperclip",
          command: this.toggleGallerySelectMode.bind(this),
        },
        {
          separator: true,
        },
        {
          label: "Delete",
          icon: "pi pi-fw pi-trash",
          command: this.handleTopMenuSelection.bind(this, "delete"),
        },
        {
          separator: true,
        },
        {
          label: "Export",
          icon: "pi pi-fw pi-external-link",
        },
      ],
    },
    {
      label: "Settings",
      icon: "pi pi-fw pi-cog",
      command: this.changeTab.bind(this, "settings"),
    },
    {
      label: "Events",
      icon: "pi pi-fw pi-calendar",
      items: [
        {
          label: "Edit",
          icon: "pi pi-fw pi-pencil",
          items: [
            {
              label: "Save",
              icon: "pi pi-fw pi-calendar-plus",
            },
            {
              label: "Delete",
              icon: "pi pi-fw pi-calendar-minus",
            },
          ],
        },
        {
          label: "Archieve",
          icon: "pi pi-fw pi-calendar-times",
          items: [
            {
              label: "Remove",
              icon: "pi pi-fw pi-calendar-minus",
            },
          ],
        },
      ],
    },
  ];

  constructor(
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

      case "fromMain:refreshGallery":
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
      this.mediaFiles = await window.rendererProcessctrl.listMediaPaths(
        this.PREFERENCES.baseDirectory
      );
    } catch (error) {
    } finally {
      this._progressBarService.toggleOff();
    }
  }

  updateSelectedItemsCount() {
    let count = this.totalSelectedItems;
    this.mediaFiles.forEach((f) => {
      if (f.customData.selected) count++;
    });

    this.totalSelectedItems = count;

    for (let idx = 0; idx < this.menuItems.length; idx++) {
      if (this.menuItems[idx].id === "selectedItemsData") {
        this.menuItems[idx] = {
          ...this.menuItems[idx],
          label: `${this.totalSelectedItems} Selected`,
        };
      }
    }
  }

  toggleGallerySelectMode() {
    this.gallerySelectMode = !this.gallerySelectMode;

    if (this.gallerySelectMode) {
      this.menuItems.push({
        label: `${this.totalSelectedItems} Selected`,
        icon: "pi pi-fw pi-power-off",
        id: "selectedItemsData",
        command: () => {
          this.toggleGallerySelectMode();
        },
      });
    } else {
      const btnIdx = this.menuItems.findIndex(
        (x) => x.id === "selectedItemsData"
      );
      btnIdx !== -1 && this.menuItems.splice(btnIdx);
      this.totalSelectedItems = 0;
    }
  }

  handleTopMenuSelection(event: TopMenuEvent) {
    if (event === "delete") {
      this.galleryActions$.next(event);
    }
  }
}
