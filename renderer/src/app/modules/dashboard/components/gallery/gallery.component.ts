import {
   ChangeDetectionStrategy,
   ChangeDetectorRef,
   Component,
   ElementRef,
   EventEmitter,
   Input,
   OnChanges,
   OnDestroy,
   OnInit,
   Output,
   SimpleChanges,
   ViewChild,
} from "@angular/core";
import { DashboardTab, GalleryAction, GalleryEvent, ImageViewerEvent, MediaFile, UserDataStore } from "common-types";
import { ConfirmationService, MenuItem, MessageService } from "primeng/api";
import { ContextMenu } from "primeng/contextmenu";
import { Menu } from "primeng/menu";
import { Subject } from "rxjs";
import { ErrorHandlerService } from "../../../shared/services/error-handler.service";

@Component({
   selector: "app-gallery",
   templateUrl: "./gallery.component.html",
   styleUrls: ["./gallery.component.css"],
   changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryComponent implements OnInit, OnChanges, OnDestroy {
   @Input() public mediaFiles: MediaFile[] = [];
   @Input() public actions$: Subject<GalleryAction> | undefined;
   @Input() public selectMode: boolean = false;
   @Input() public mediaFileFilter: MediaFile["type"] = "image";
   @Input() public PREFERENCES: UserDataStore = {};

   @Output() public itemSelectedEvent: EventEmitter<void> = new EventEmitter<void>();
   @Output() galleryEvent: EventEmitter<GalleryEvent> = new EventEmitter<GalleryEvent>();
   @Output() public tabChangeEvent: EventEmitter<DashboardTab> = new EventEmitter<DashboardTab>();

   @ViewChild("spotlightImageElement") public spotlightImgRef: ElementRef | undefined;
   @ViewChild("imageViewerContainer") public imageViewerContainerRef: ElementRef | undefined;
   @ViewChild("contextMenuRef") public contextMenuRef: ContextMenu | undefined;
   @ViewChild("imageMenu") public imageMenu: Menu | undefined;

   public spotlightImage: MediaFile | null = null;
   public editing: boolean = false;
   public previewMode: boolean = false;

   public saveOptions = [
      {
         label: "Save a copy",
         icon: "pi pi-plus",
         command: this.applyChanges.bind(this),
      },
   ];

   public contextMenuOptions: MenuItem[] = this.generateContextMenuOptionsForMediaFile();

   private _editedImageRefs: string[] = [];
   private _unsubscribe$: Subject<void> = new Subject<void>();
   private _previewStatus$: Subject<{
      status: boolean;
      updatedImageData: string | undefined;
   }> | null = null;

   constructor(
      private _cd: ChangeDetectorRef,
      private _confirmationServ: ConfirmationService,
      private _messageServ: MessageService,
      private _errorHandlerService: ErrorHandlerService
   ) {}

   ngOnInit(): void {
      if (this.actions$) {
         const actionsSubscription = this.actions$.asObservable().subscribe((action: GalleryAction) => {
            if (action.name === "delete") {
               this.deleteSelectedItems();
            } else if (action.name === "imagePreview") {
               if (action.data) {
                  this.spotlightImage = {
                     name: "Preview",
                     path: action.data,
                     type: "image",
                     createdAt: Date.now(),
                  };
                  this.editing = true;
                  this.previewMode = true;

                  this._cd.detectChanges();

                  new Promise<string | undefined>((resolve, reject) => {
                     this._previewStatus$ = new Subject<{
                        status: boolean;
                        updatedImageData: string | undefined;
                     }>();
                     this._previewStatus$.asObservable().subscribe(({ status, updatedImageData }) => {
                        if (status) return resolve(updatedImageData);
                        return reject("Preview rejected");
                     });
                  })
                     .then((updatedImageData: string | undefined) => {
                        action.callback &&
                           typeof action.callback === "function" &&
                           action.callback(undefined, updatedImageData);
                     })
                     .catch((e: any) => {
                        action.callback && typeof action.callback === "function" && action.callback(e);
                     })
                     .finally(() => {
                        this._previewStatus$?.complete();
                        this._previewStatus$ = null;
                        this.spotlightImage = null;
                        this.editing = false;
                        this.previewMode = false;
                     });
               }
            }
         });
         this._unsubscribe$.asObservable().subscribe(() => {
            actionsSubscription.unsubscribe();
         });
      }
   }

   ngOnChanges(changes: SimpleChanges) {
      if (changes["mediaFiles"]) {
         let spotlightImageUpdated = false;

         this.mediaFiles.forEach((f, i) => {
            f.path = this._editedImageRefs.includes(f.name) ? this.bustCache(f.path) : f.path;
            f.customData = {
               idx: i,
               selected: false,
            };

            if (f.name === this.spotlightImage?.name) {
               this.spotlightImage = f;
               spotlightImageUpdated = true;
            }
         });

         // If the updated list of images don't have an image with the same name as the current spotlightImage, close image viewer. Happens especially when an image is deleted within the image viewer.
         if (this.spotlightImage && !spotlightImageUpdated) {
            this.editing = false;
            this.spotlightImage = null;
         }
      }
   }

   bustCache(url: string) {
      return `${url}?nonce=${Date.now()}`;
   }

   generateContextMenuOptionsForMediaFile(mediaFile?: MediaFile): MenuItem[] {
      if (!mediaFile) return [];

      const selectMediaItem = () => {
         mediaFile.customData = {
            ...(mediaFile.customData || {}),
            selected: true,
         };
      };

      const getMediaFileIdx = () =>
         (mediaFile.customData?.["idx"] as number | undefined) ||
         this.mediaFiles.findIndex((f) => f.name === mediaFile.name);

      return [
         {
            label: "Open",
            command: () => this.showImageInSpotlight(getMediaFileIdx()),
            visible: mediaFile.type === "image",
         },
         {
            separator: true,
            visible: mediaFile.type === "image",
         },
         {
            label: "Copy",
            command: this.copyImageToClipboard.bind(this, mediaFile),
            visible: mediaFile.type === "image",
         },
         {
            separator: true,
            visible: mediaFile.type === "image",
         },
         {
            label: "Edit",
            command: () => {
               this.showImageInSpotlight(getMediaFileIdx());
               this._cd.detectChanges();
               this.editing = true;
            },
            visible: mediaFile.type === "image",
         },
         {
            separator: true,
            visible: mediaFile.type === "image",
         },
         {
            label: "Select",
            disabled: this.selectMode,
            command: (e) => {
               selectMediaItem();
               this.galleryEvent.emit("selectModeOn");
            },
         },
         {
            separator: true,
         },
         {
            label: "Delete",
            command: (e) => {
               this.deleteSelectedItems(mediaFile);
            },
         },
      ];
   }

   showContextMenu(event: MouseEvent, mediaFile: MediaFile) {
      if (!this.contextMenuRef) return;

      this.contextMenuOptions = this.generateContextMenuOptionsForMediaFile(mediaFile);
      this.contextMenuRef.show(event);
   }

   selectItem(idx: number, event?: MouseEvent) {
      if (event) event.preventDefault();

      this.mediaFiles[idx].customData = {
         ...(this.mediaFiles[idx].customData || {}),
         selected: !!!this.mediaFiles[idx]?.customData?.["selected"],
      };
      this.galleryEvent.emit("itemSelected");
   }

   showImageInSpotlight(imageIdx: number) {
      if (!this.mediaFiles[imageIdx]) return;

      this.spotlightImage = this.mediaFiles[imageIdx].type === "image" ? this.mediaFiles[imageIdx] : null;

      this._cd.detectChanges();
   }

   async copyImageToClipboard(mediaFile: MediaFile) {
      try {
         await window.rendererProcessCtrl.invoke("ipc:copyImageToClipboard", mediaFile);

         this._messageServ.add({
            severity: "info",
            detail: "Copied to clipboard.",
         });
      } catch (error) {
         this._errorHandlerService.handleError(error, {
            header: "There was an error copying the image to clipboard.",
         });
      }
   }

   nextImage() {
      if (!this.spotlightImage) return;

      const currentIdx: number = this.mediaFiles.findIndex((f) => f.path === this.spotlightImage?.path);

      let nextIdx: number = currentIdx;

      for (let idx = Math.min(currentIdx + 1, this.mediaFiles.length - 1); idx < this.mediaFiles.length; idx++) {
         if (this.mediaFiles[idx].type === "image") {
            nextIdx = idx;
            break;
         }
      }

      this.spotlightImage = this.mediaFiles[nextIdx];

      this.editing = false;
   }

   previousImage() {
      if (!this.spotlightImage) return;

      const currentIdx = this.mediaFiles.findIndex((f) => f.path === this.spotlightImage?.path);

      let prevIdx: number = currentIdx;

      for (let idx = Math.max(currentIdx - 1, 0); idx >= 0; idx--) {
         if (this.mediaFiles[idx].type === "image") {
            prevIdx = idx;
            break;
         }
      }

      this.spotlightImage = this.mediaFiles[prevIdx];

      this.editing = false;
   }

   async applyChanges(editedImgUrl: string, asCopy: boolean = false) {
      try {
         if (!this.spotlightImage) return;

         const currentIdx = this.mediaFiles.findIndex((f) => f.name === this.spotlightImage?.name);

         if (asCopy)
            this.mediaFiles[currentIdx].name =
               Date.now() + "." + (this.mediaFiles[currentIdx]?.name.split(".").pop() || "");

         await window.rendererProcessCtrl.invoke("ipc:saveEditedImage", {
            dataUrl: editedImgUrl,
            mode: "image",
            name: this.mediaFiles[currentIdx].name,
         });

         this._editedImageRefs.push(this.spotlightImage.name);
      } catch (error) {
         this._errorHandlerService.handleError(error);
      }
   }

   handleViewerEvent(event: ImageViewerEvent) {
      switch (event.eventName) {
         case "save":
            return event.data ? this.applyChanges(event.data) : undefined;
         case "saveAsCopy":
            return event.data ? this.applyChanges(event.data, true) : undefined;
         case "copyImage":
            return this.spotlightImage ? this.copyImageToClipboard(this.spotlightImage) : undefined;
         case "nextImage":
            return this.nextImage();
         case "previousImage":
            return this.previousImage();
         case "closeViewer":
            this.spotlightImage = null;
            this.editing = false;
            return;
         case "closeEditor":
            this.editing = false;
            this._cd.detectChanges();
            return;
         case "openEditor":
            this.editing = true;
            return;
         case "delete":
            return this.spotlightImage ? this.deleteSelectedItems(this.spotlightImage) : undefined;
         case "acceptPreview":
            return this._previewStatus$?.next({
               status: true,
               updatedImageData: event.data,
            });
         case "rejectPreview":
            return this._previewStatus$?.next({
               status: false,
               updatedImageData: undefined,
            });
         default:
            return;
      }
   }

   deleteSelectedItems(mediaFiles?: MediaFile | MediaFile[]) {
      try {
         const selectedItems: MediaFile[] = mediaFiles
            ? ([] as MediaFile[]).concat(mediaFiles)
            : this.mediaFiles.filter((f) => f.customData?.["selected"] === true);

         this._confirmationServ.confirm({
            header: "Confirm Delete",
            message: `Are you sure you want to delete ${selectedItems.length} selected file(s)?`,
            accept: async () => {
               try {
                  await window.rendererProcessCtrl.invoke(
                     "ipc:deleteMediaFiles",
                     selectedItems.map((f) => f.name)
                  );
                  this._messageServ.add({
                     severity: "info",
                     summary: "Deleted",
                     detail: `Successfully deleted ${selectedItems.length} file(s)`,
                  });
                  this.galleryEvent.emit("selectModeOff");
               } catch (error) {
                  this._errorHandlerService.handleError(error, {
                     header: "There was an error deleting the file(s)",
                  });
               }
            },
         });
      } catch (error) {
         this._errorHandlerService.handleError(error);
      }
   }

   ngOnDestroy(): void {
      this._unsubscribe$.next();
   }
}
