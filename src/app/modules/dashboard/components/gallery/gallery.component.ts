import {
  AfterViewInit,
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
import { MediaFile } from "../../../../../common/types";
import Cropper from "cropperjs";
import { ConfirmationService, MenuItem } from "primeng/api";
import { Subject } from "rxjs";
import { ContextMenu } from "primeng/contextmenu";
import { GalleryEvent } from "../../../../../common/types";
import { MessageService } from "primeng/api";
import ImageViewer from "viewerjs";

@Component({
  selector: "app-gallery",
  templateUrl: "./gallery.component.html",
  styleUrls: ["./gallery.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  @Input() public mediaFiles: MediaFile[] = [];
  @Input() public actions$: Subject<string> | undefined;
  @Input() public selectMode: boolean = false;
  @Input() public mediaFileFilter: MediaFile["type"] = "image";

  @Output() public itemSelectedEvent: EventEmitter<void> =
    new EventEmitter<void>();
  @Output() galleryEvent: EventEmitter<GalleryEvent> =
    new EventEmitter<GalleryEvent>();

  @ViewChild("spotlightImageElement") public spotlightImgRef:
    | ElementRef
    | undefined;
  @ViewChild("contextMenuRef") public contextMenuRef: ContextMenu | undefined;
  @ViewChild("mediaItems") public mediaContainerRef: ElementRef | undefined;

  public imageEditor: Cropper | null = null;
  public spotlightImage: MediaFile | null = null;

  public imageOptions: MenuItem[] = [
    {
      label: "Edit",
      icon: "pi pi-pencil",
      command: this.enableImageEditing.bind(this),
    },
  ];

  public saveOptions = [
    {
      label: "Save",
      icon: "pi pi-save",
      command: this.applyChanges.bind(this),
    },
    {
      separator: true,
    },
    {
      label: "Save as a new file",
      icon: "pi pi-plus",
      command: this.applyChanges.bind(this),
    },
  ];

  public contextMenuOptions: MenuItem[] =
    this.generateContextMenuOptionsForMediaFile();

  private _editedImageRefs: string[] = [];
  private _unsubscribe$: Subject<void> = new Subject<void>();
  private _imageViewer: ImageViewer | undefined;

  constructor(
    private _cd: ChangeDetectorRef,
    private _confirmationServ: ConfirmationService,
    private _messageServ: MessageService
  ) {}

  ngOnInit(): void {
    if (this.actions$) {
      const actionsSubscription = this.actions$
        .asObservable()
        .subscribe((action) => {
          if (action === "delete") {
            this.deleteSelectedItems();
          }
        });
      this._unsubscribe$.asObservable().subscribe(() => {
        actionsSubscription.unsubscribe();
      });
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["mediaFiles"]) {
      this.mediaFiles.forEach((f, i) => {
        f.path = this._editedImageRefs.includes(f.name)
          ? this.bustCache(f.path)
          : f.path;
        f.customData = {
          idx: i,
          selected: false,
        };

        if (f.name === this.spotlightImage?.name) {
          this.spotlightImage = f;
        }
      });
    }
  }

  ngAfterViewInit() {
    if (!this.mediaContainerRef) return;

    const container: HTMLDivElement = this.mediaContainerRef.nativeElement;

    this.initializeImageViewer(container);

    const observer = new MutationObserver(
      this.initializeImageViewer.bind(this, container)
    );

    observer.observe(container, {
      childList: true,
    });

    this._unsubscribe$.asObservable().subscribe(() => {
      observer.disconnect();
    });
  }

  initializeImageViewer(container: HTMLDivElement) {
    if (this._imageViewer) {
      this._imageViewer.update();
      return;
    }

    this._imageViewer = new ImageViewer(container, {
      inline: false,
      zIndex: 1000,
      view: () => {},
      show: (event) => {
        if (this.selectMode) event.preventDefault();
      },
      viewed: () => {},
      toolbar: {
        zoomIn: true,
        zoomOut: true,
        oneToOne: true,
        reset: true,
        prev: true,
        play: true,
        next: true,
        rotateLeft: true,
        rotateRight: true,
        flipHorizontal: true,
        flipVertical: true,
        options: {
          size: "large",
          show: true,
        },
      },
    });
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
        command: async () => {
          await window.rendererProcessCtrl
            .invoke("ipc:copyImageToClipboard", mediaFile)
            ?.catch((e: any) => {
              this._messageServ.add({
                severity: "error",
                detail: "There was an error copying the image to clipboard.",
              });
            });
          this._messageServ.add({
            severity: "info",
            detail: "Copied to clipboard.",
          });
        },
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
          this.enableImageEditing();
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

    this.contextMenuOptions =
      this.generateContextMenuOptionsForMediaFile(mediaFile);
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

    this.spotlightImage =
      this.mediaFiles[imageIdx].type === "image"
        ? this.mediaFiles[imageIdx]
        : null;
  }

  enableImageEditing() {
    if (!this.spotlightImgRef) return;
    this.showImageInEditor(this.spotlightImgRef.nativeElement);
  }

  showImageInEditor(imageElement: HTMLImageElement) {
    if (this.imageEditor || !this.spotlightImage) return;

    this.imageEditor = new Cropper(imageElement, {
      guides: false,
      autoCropArea: 1,
      scalable: true,
      zoomable: true,
      background: false,
      crop: () => {},
    });
  }

  nextImage() {
    if (!this.spotlightImage) return;

    const currentIdx: number = this.mediaFiles.findIndex(
      (f) => f.path === this.spotlightImage?.path
    );

    let nextIdx: number = currentIdx;

    for (
      let idx = Math.min(currentIdx + 1, this.mediaFiles.length - 1);
      idx < this.mediaFiles.length;
      idx++
    ) {
      if (this.mediaFiles[idx].type === "image") {
        nextIdx = idx;
        break;
      }
    }

    this.spotlightImage = this.mediaFiles[nextIdx];
  }

  previousImage() {
    if (!this.spotlightImage) return;

    const currentIdx = this.mediaFiles.findIndex(
      (f) => f.path === this.spotlightImage?.path
    );

    let prevIdx: number = currentIdx;

    for (let idx = Math.max(currentIdx - 1, 0); idx >= 0; idx--) {
      if (this.mediaFiles[idx].type === "image") {
        prevIdx = idx;
        break;
      }
    }

    this.spotlightImage = this.mediaFiles[prevIdx];
  }

  rotateLeft() {
    if (!this.imageEditor) return;
    this.imageEditor.rotate(-90);
    this.resetCropBoxToFitImage();
  }

  rotateRight() {
    if (!this.imageEditor) return;
    this.imageEditor.rotate(90);
    this.resetCropBoxToFitImage();
  }

  resetCropBoxToFitImage() {
    if (!this.imageEditor) return;

    const cropData = this.imageEditor.getData();
    const imageData = this.imageEditor.getImageData();
    const canvasData = this.imageEditor.getCanvasData();

    this.imageEditor.setCropBoxData({
      height:
        cropData.rotate === 90 || cropData.rotate === 270
          ? imageData.width
          : imageData.height,
      width:
        cropData.rotate === 90 || cropData.rotate === 270
          ? imageData.height
          : imageData.width,
      left: canvasData.left,
      top: canvasData.top,
    });
  }

  cropPreview() {
    if (!this.imageEditor) return;

    this.imageEditor.replace(
      this.imageEditor.getCroppedCanvas({}).toDataURL("image/png")
    );
  }

  /**
   * Reset edits to original using backed-up image src, wait until UI loads the new image, and then enable editing again.
   */
  resetImageToPrevEditingState() {
    if (!this.imageEditor || !this.spotlightImage) return;
    this.imageEditor.replace(this.spotlightImage.path);
  }

  async applyChanges() {
    try {
      if (!this.spotlightImage || !this.imageEditor) return;

      const editedImgUrl: string = this.imageEditor
        .getCroppedCanvas({})
        .toDataURL("image/png");

      this.exitEditor();

      const currentIdx = this.mediaFiles.findIndex(
        (f) => f.name === this.spotlightImage?.name
      );

      await window.rendererProcessCtrl.invoke("ipc:saveEditedImage", {
        dataUrl: editedImgUrl,
        mode: "image",
        name: this.mediaFiles[currentIdx].name,
      });

      this._editedImageRefs.push(this.spotlightImage.name);
    } catch (error) {
      console.log(error);
    }
  }

  exitEditor() {
    this._destroyImageEditor();
  }

  private _destroyImageEditor() {
    if (!this.imageEditor) return;
    this.imageEditor.destroy();
    this.imageEditor = null;
  }

  closeImageSpotlight() {
    this.exitEditor();
    this.spotlightImage = null;
  }

  async deleteSelectedItems(mediaFiles?: MediaFile | MediaFile[]) {
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
            this._messageServ.add({
              severity: "error",
              summary: "Error",
              detail: "There was an error deleting the file(s)",
            });
          }
        },
      });
    } catch (error) {}
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
  }
}
