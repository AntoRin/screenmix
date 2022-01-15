import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { MediaFile } from "../../../../../electron/types";
import Cropper from "cropperjs";
import { ConfirmationService, MenuItem } from "primeng/api";
import { Subject } from "rxjs";
import { ContextMenu } from "primeng/contextmenu";
import { GalleryEvent } from "../../../../types";

@Component({
  selector: "app-gallery",
  templateUrl: "./gallery.component.html",
  styleUrls: ["./gallery.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryComponent implements OnInit, OnChanges {
  @Input() public mediaFiles: MediaFile[] = [];
  @Input() public actions$: Subject<string> | undefined;
  @Input() public selectMode: boolean = false;

  @Output() public itemSelectedEvent: EventEmitter<void> =
    new EventEmitter<void>();
  @Output() galleryEvent: EventEmitter<GalleryEvent> =
    new EventEmitter<GalleryEvent>();

  @ViewChild("spotlightImageElement") public spotlightImgRef:
    | ElementRef
    | undefined;
  @ViewChild("contextMenuRef") public contextMenuRef: ContextMenu | undefined;

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

  public contextMenuOptions: MenuItem[] = [];

  private _editedImageRefs: string[] = [];

  constructor(private _confirmationServ: ConfirmationService) {}

  ngOnInit(): void {
    if (this.actions$)
      this.actions$.asObservable().subscribe((action) => {
        if (action === "delete") {
          this.deleteSelectedItems();
        }
      });
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

  bustCache(url: string) {
    return `${url}?nonce=${Date.now()}`;
  }

  showContextMenu(event: MouseEvent, mediaItemIdx: number) {
    if (!this.contextMenuRef) return;

    const selectMediaItem = () => {
      this.mediaFiles[mediaItemIdx].customData = {
        ...(this.mediaFiles[mediaItemIdx].customData || {}),
        selected: true,
      };
    };

    this.contextMenuOptions = [
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
          selectMediaItem();
          this.deleteSelectedItems();
        },
      },
    ];

    this.contextMenuRef.show(event);
  }

  selectItem(idx: number) {
    this.mediaFiles[idx].customData = {
      ...(this.mediaFiles[idx].customData || {}),
      selected: !!!this.mediaFiles[idx]?.customData?.["selected"],
    };
    this.galleryEvent.emit("itemSelected");
  }

  showImageInSpotlight(imageIdx: number) {
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

      await window.rendererProcessctrl.saveEditedImage({
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

  async deleteSelectedItems() {
    try {
      const selectedItems = this.mediaFiles.filter(
        (f) => f.customData?.["selected"] === true
      );
      this._confirmationServ.confirm({
        header: "Confirm Delete",
        message: `Are you sure you want to delete ${selectedItems.length} items?`,
        accept: async () => {
          await window.rendererProcessctrl.deleteMediaFiles(
            selectedItems.map((f) => f.name)
          );
        },
      });
    } catch (error) {}
  }
}
