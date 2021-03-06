import { Component, HostListener, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import {
  CaptureMode,
  DashboardTab,
  GalleryAction,
  GalleryEvent,
  MediaFile,
  MediaStreamEvent,
  ScreenData,
  TopMenuEvent,
  UserDataStore,
} from "common-types";
import { MenuItem } from "primeng/api";
import { Subject } from "rxjs";
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
  public galleryActions$: Subject<GalleryAction> = new Subject<GalleryAction>();
  public gallerySelectMode: boolean = false;
  public totalSelectedItems: number = 0;

  public menuItemsDefault: MenuItem[] = this.getMenuItemsDefault();
  public menuItemsSelect: MenuItem[] = this.getMenuItemsSelect();

  public mediaFileFilter: MediaFile["type"] = "image";

  public filterTypeOptions = [
    {
      label: "Images",
      value: "image",
    },
    {
      label: "Videos",
      value: "video",
    },
  ];

  public availableScreensList: ScreenData[] = [];
  public showSelectScreenModal: boolean = false;
  public selectScreenModalSubject: Subject<string> = new Subject<string>();

  constructor(
    private _router: Router,
    private _mediaStreamService: MediaStreamService,
    private _progressBarService: ProgressBarService
  ) {}

  ngOnInit(): void {
    this.getRequiredData();
    this._mediaStreamService.streamNotifications$
      .asObservable()
      .subscribe((notification: MediaStreamEvent) => {
        switch (notification.name) {
          case "videoCaptureStart":
            this.showVideoCaptureMarker = true;
            break;
          case "videoCaptureEnd":
            this.showVideoCaptureMarker = false;
            break;
          case "imagePreview":
            if (notification.data && notification.callback) {
              this.galleryActions$.next({
                name: "imagePreview",
                data: notification.data,
                callback: notification.callback,
              });
            }
            break;
          case "selectScreen":
            if (!notification.callback) break;

            // Get all available desktop screens and wait until user selects one by using a subscription.
            window.rendererProcessCtrl
              .invoke<ScreenData[]>("ipc:getAvailableScreens")
              ?.then((data) => {
                this.availableScreensList = data;
                this.showSelectScreenModal = true;
                const selectModalSubscription = this.selectScreenModalSubject
                  .asObservable()
                  .subscribe((srcId) => {
                    if (!notification.callback) return;
                    notification.callback(undefined, srcId);
                    selectModalSubscription.unsubscribe();
                  });
              });
            break;
        }
      });
  }

  selectScreen(srcId: string) {
    this.selectScreenModalSubject.next(srcId);
    this.availableScreensList = [];
    this.showSelectScreenModal = false;
  }

  getMenuItemsDefault() {
    return [
      {
        label: "File",
        icon: "pi pi-fw pi-file",
        items: [
          {
            label: "New",
            icon: "pi pi-fw pi-plus",
            items: [
              {
                label: "Screenshot",
                icon: "pi pi-fw pi-camera",
                command: this.handleCaptureOnClick.bind(this, "image"),
              },
              {
                label: "Capture Screen",
                icon: "pi pi-fw pi-video",
                command: this.handleCaptureOnClick.bind(this, "video"),
              },
            ],
          },
          {
            separator: true,
          },
          {
            label: "Select",
            icon: "pi pi-star",
            command: this.toggleGallerySelectMode.bind(this),
          },
          {
            separator: true,
          },
          {
            label: "Export",
            icon: "pi pi-fw pi-external-link",
          },
          {
            separator: true,
          },
          {
            label: "Open Folder",
            icon: "pi pi-folder-open",
            command: this.openBaseDirectory.bind(this),
          },
          {
            separator: true,
          },
          {
            label: "Exit",
            icon: "pi pi-power-off",
            command: this.exitApp.bind(this),
          },
        ] as MenuItem[],
      },
      {
        label: "Home",
        icon: "pi pi-home",
        command: this.changeTab.bind(this, "gallery"),
      },
      {
        label: "Folders",
        icon: "pi pi-folder",
        command: () => {
          this._router.navigate([""], { queryParams: { redirect: false } });
        },
      },
      {
        label: "Settings",
        icon: "pi pi-fw pi-cog",
        command: this.changeTab.bind(this, "settings"),
      },
    ];
  }

  getMenuItemsSelect() {
    return [
      {
        label: `${this.totalSelectedItems} Selected`,
        icon: "pi pi-info",
        id: "selectedItemsData",
      },
      {
        label: `Cancel`,
        icon: "pi pi-times",
        command: this.handleTopMenuSelection.bind(this, "selectToggle"),
      },
      {
        label: "Delete",
        icon: "pi pi-fw pi-trash",
        disabled: this.totalSelectedItems <= 0,
        command: this.handleTopMenuSelection.bind(this, "delete"),
      },
    ];
  }

  addStatusItemsToMenu(currentItems: MenuItem[]): MenuItem[] {
    return this.showVideoCaptureMarker
      ? currentItems.concat(
          {
            separator: true,
          },
          {
            label: "Recording",
            icon: "pi pi-video",
            styleClass: "bg-indigo-800",
            title: "Recording in progress",
            command: () => {
              this._mediaStreamService.captureScreen(
                "video",
                this.PREFERENCES.scResolution
              );
            },
          }
        )
      : currentItems;
  }

  handleFilterTypeChange(event: any) {
    this.mediaFileFilter = event.value;
  }

  @HostListener("window:message", ["$event"])
  handleScreenEvents(event: MessageEvent) {
    switch (event.data) {
      case "fromMain:takeScreenshot":
        return this._mediaStreamService.captureScreen(
          "image",
          this.PREFERENCES.ssResolution,
          false
        );

      case "fromMain:takeScreenshotOfCurrentWindow":
        return this._mediaStreamService.captureScreen(
          "image",
          this.PREFERENCES.ssResolution,
          true
        );

      case "fromMain:captureScreen":
        return this._mediaStreamService.captureScreen(
          "video",
          this.PREFERENCES.scResolution,
          false
        );

      case "fromMain:captureCurrentScreen":
        return this._mediaStreamService.captureScreen(
          "video",
          this.PREFERENCES.scResolution,
          true
        );

      case "fromMain:newImage":
        this.getGallery();
        this.mediaFileFilter = "image";
        return;

      case "fromMain:newVideo":
        this.getGallery();
        this.mediaFileFilter = "video";
        return;

      case "fromMain:refreshGallery":
        return this.getGallery();

      case "fromMain:enablePreviewPaneMode":
        return this._router.navigate(["preview-pane"]);

      default:
        return;
    }
  }

  handleCaptureOnClick(mode: CaptureMode) {
    const resolution =
      mode === "image"
        ? this.PREFERENCES.ssResolution
        : this.PREFERENCES.scResolution;

    return this._mediaStreamService.captureScreen(
      mode,
      resolution,
      false,
      true
    );
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
      this.PREFERENCES = await window.rendererProcessCtrl.invoke<UserDataStore>(
        "ipc:getAllPreferences"
      );
    } catch (error) {
    } finally {
      this._progressBarService.toggleOff();
    }
  }

  async getGallery() {
    try {
      this._progressBarService.toggleOn();
      this.mediaFiles = await window.rendererProcessCtrl.invoke<MediaFile[]>(
        "ipc:listMediaPaths",
        this.PREFERENCES.baseDirectory
      );
    } catch (error) {
    } finally {
      this._progressBarService.toggleOff();
      this.updateSelectedItemsCount();
    }
  }

  updateSelectedItemsCount() {
    if (!this.gallerySelectMode) return;

    let count = 0;

    this.mediaFiles.forEach((f) => {
      if (f.customData?.["selected"]) count++;
    });

    this.totalSelectedItems = count;
    this.menuItemsSelect = this.getMenuItemsSelect();
  }

  toggleGallerySelectMode(mode?: boolean) {
    this.gallerySelectMode =
      mode !== undefined ? mode : !this.gallerySelectMode;

    if (!this.gallerySelectMode) {
      for (let idx = 0; idx < this.mediaFiles.length; idx++) {
        this.mediaFiles[idx].customData = {
          ...(this.mediaFiles[idx].customData || {}),
          selected: false,
        };
      }
    } else {
      this.updateSelectedItemsCount();
    }
  }

  handleTopMenuSelection(event: TopMenuEvent): void {
    switch (event) {
      case "delete":
        return this.galleryActions$.next({ name: event });
      case "selectToggle":
        return this.toggleGallerySelectMode();
      default:
        return;
    }
  }

  handleGalleryEvent(event: GalleryEvent) {
    switch (event) {
      case "itemSelected":
        return this.updateSelectedItemsCount();
      case "selectModeOn":
        return this.toggleGallerySelectMode(true);
      case "selectModeOff":
        return this.toggleGallerySelectMode(false);
      default:
        return;
    }
  }

  async openBaseDirectory() {
    try {
      await window.rendererProcessCtrl.invoke("ipc:openBaseDirectory");
    } catch (error) {}
  }

  exitApp() {
    try {
      window.rendererProcessCtrl.invoke("ipc:exitApplication");
    } catch (error) {}
  }
}
