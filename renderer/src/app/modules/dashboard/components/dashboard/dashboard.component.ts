import { ChangeDetectorRef, Component, HostListener, OnInit } from "@angular/core";
import {
   AppMetaData,
   AppUpdaterState,
   CaptureMode,
   DashboardTab,
   GalleryAction,
   GalleryEvent,
   MainToRendererEvent,
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
import { ErrorHandlerService } from "../../../shared/services/error-handler.service";

@Component({
   selector: "app-dashboard",
   templateUrl: "./dashboard.component.html",
   styleUrls: ["./dashboard.component.css"],
})
export class DashboardComponent implements OnInit {
   public currentTab: DashboardTab = "gallery";
   public appMetaData: AppMetaData | null = null;
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
   public showAboutModal: boolean = false;
   public appUpdaterState: AppUpdaterState | null = null;
   public appUpdateStatusMessage: string | null = null;

   public updateBtnDisabled: boolean = false;
   private _defaultUpdateError: string = "Something went wrong while fetching updates...";

   constructor(
      private _mediaStreamService: MediaStreamService,
      private _progressBarService: ProgressBarService,
      private _cd: ChangeDetectorRef,
      private _errorHandlerService: ErrorHandlerService
   ) {}

   ngOnInit(): void {
      this.getRequiredData();
      this._mediaStreamService.streamNotifications$.asObservable().subscribe((notification: MediaStreamEvent) => {
         switch (notification.name) {
            case "videoCaptureStart":
               this.showVideoCaptureMarker = true;
               this.menuItemsDefault = this.getMenuItemsDefault();
               this.menuItemsSelect = this.getMenuItemsSelect();
               break;
            case "videoCaptureEnd":
               this.showVideoCaptureMarker = false;
               this.menuItemsDefault = this.getMenuItemsDefault();
               this.menuItemsSelect = this.getMenuItemsSelect();
               break;
            case "imagePreview":
               if (notification.data && notification.callback) {
                  this.currentTab = "gallery";
                  this._cd.detectChanges();

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
                     const selectModalSubscription = this.selectScreenModalSubject.asObservable().subscribe((srcId) => {
                        if (!notification.callback) return;
                        notification.callback(undefined, srcId);
                        selectModalSubscription.unsubscribe();
                     });
                  })
                  .catch(this._errorHandlerService.handleError.bind(this._errorHandlerService));
               break;
         }
      });
   }

   @HostListener("window:message", ["$event"])
   handleScreenEvents(event: MessageEvent<MainToRendererEvent>) {
      try {
         switch (event.data) {
            case "fromMain:takeScreenshot":
               return this._mediaStreamService.captureScreen("image", this.PREFERENCES.ssResolution, false);

            case "fromMain:takeScreenshotOfCurrentWindow":
               return this._mediaStreamService.captureScreen("image", this.PREFERENCES.ssResolution, true);

            case "fromMain:captureScreen":
               return this._mediaStreamService.captureScreen("video", this.PREFERENCES.scResolution, false);

            case "fromMain:captureCurrentScreen":
               return this._mediaStreamService.captureScreen("video", this.PREFERENCES.scResolution, true);

            case "fromMain:newImage":
               this.getGallery();
               this.currentTab = "gallery";
               this.mediaFileFilter = "image";
               return;

            case "fromMain:newVideo":
               this.getGallery();
               this.currentTab = "gallery";
               this.mediaFileFilter = "video";
               return;

            case "fromMain:refreshGallery":
               return this.getGallery();

            case "fromMain:preferencesUpdated":
               this.getRequiredData();
               return;

            case "fromMain:appUpdater:stateChange":
               this.getAppUpdaterState();
               return;

            default:
               return;
         }
      } catch (error) {
         return this._errorHandlerService.handleError(error);
      }
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
                        label: this.showVideoCaptureMarker ? "Stop Recording" : "Capture Screen",
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
                  label: "Open Folder",
                  icon: "pi pi-folder-open",
                  command: this.openBaseDirectory.bind(this),
               },
               {
                  separator: true,
               },
               {
                  label: "About screenmix",
                  icon: "pi pi-exclamation-circle",
                  command: () => {
                     this.showAboutModal = true;
                  },
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
               this.currentTab = "workspaces";
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

   /**
    * Add dynamic elements to the top menu, based on a particular status change.
    */
   addStatusItemsToMenu(currentItems: MenuItem[]): MenuItem[] {
      const additionalMenuItems: MenuItem | MenuItem[] = [];

      return this.showVideoCaptureMarker ? currentItems.concat(additionalMenuItems) : currentItems;
   }

   handleFilterTypeChange(event: any) {
      this.mediaFileFilter = event.value;
   }

   handleCaptureOnClick(mode: CaptureMode) {
      const resolution = mode === "image" ? this.PREFERENCES.ssResolution : this.PREFERENCES.scResolution;

      return this._mediaStreamService
         .captureScreen(mode, resolution, false, true)
         .catch(this._errorHandlerService.handleError.bind(this._errorHandlerService));
   }

   changeTab(tab: DashboardTab) {
      this.currentTab = tab;
   }

   async getRequiredData() {
      try {
         this._progressBarService.toggleOn();
         await this.getAppMetaData();
         await this.getAppUpdaterState();
         await this.getAllPreferences();
         await this.getGallery();
      } catch (error) {
         this._errorHandlerService.handleError(error);
      } finally {
         this._progressBarService.toggleOff();
      }
   }

   async getAppMetaData() {
      try {
         this.appMetaData = await window.rendererProcessCtrl.invoke("ipc:getAppMetaData");
      } catch (error) {
         this._errorHandlerService.handleError(error);
      }
   }

   async checkForAppUpdates() {
      try {
         await window.rendererProcessCtrl.invoke("ipc:checkForAppUpdates");
      } catch (error: any) {
         this.appUpdateStatusMessage = error?.message || this._defaultUpdateError;
      }
   }

   async getAppUpdaterState() {
      try {
         const updaterState = await window.rendererProcessCtrl.invoke<AppUpdaterState>("ipc:getAppUpdaterState");

         switch (updaterState.status) {
            case "updateError":
               this.appUpdateStatusMessage = updaterState?.error?.message || this._defaultUpdateError;
               this.updateBtnDisabled = false;
               break;
            case "checkingForUpdate":
               this.appUpdateStatusMessage = "Checking for updates...";
               this.updateBtnDisabled = true;
               break;
            case "updateNotAvailable":
               this.appUpdateStatusMessage = "You have the latest version.";
               this.updateBtnDisabled = false;
               break;
            case "updateAvailable":
               this.updateBtnDisabled = true;
               this.appUpdateStatusMessage = "Downloading update...";
               break;
            case "updateDownloaded":
               this.updateBtnDisabled = false;
               this.appUpdateStatusMessage = "Update ready to install.";
               break;
         }

         this.appUpdaterState = updaterState;
      } catch (error) {
         this._errorHandlerService.handleError(error);
      }
   }

   async quitAndInstallUpdate() {
      try {
         await window.rendererProcessCtrl.invoke<void>("ipc:quitAndInstallUpdate");
      } catch (error) {
         this._errorHandlerService.handleError(error);
      }
   }

   async getAllPreferences() {
      try {
         this._progressBarService.toggleOn();
         this.PREFERENCES = await window.rendererProcessCtrl.invoke<UserDataStore>("ipc:getAllPreferences");
      } catch (error: any) {
         this._errorHandlerService.handleError(error);
      } finally {
         this._progressBarService.toggleOff();
      }
   }

   async getGallery() {
      try {
         this._progressBarService.toggleOn();
         this.mediaFiles = await window.rendererProcessCtrl.invoke<MediaFile[]>("ipc:listMediaPaths");
      } catch (error: any) {
         if (error.code === "MP_ENOENT_BASE_DIR") {
            this._errorHandlerService.handleError(error, {
               header: "Workspace Not Found",
            });
         } else {
            this._errorHandlerService.handleError(error);
         }
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
      this.gallerySelectMode = mode !== undefined ? mode : !this.gallerySelectMode;

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
      } catch (error) {
         this._errorHandlerService.handleError(error);
      }
   }

   async exitApp() {
      try {
         await window.rendererProcessCtrl.invoke("ipc:exitApplication");
      } catch (error) {
         this._errorHandlerService.handleError(error);
      }
   }
}
